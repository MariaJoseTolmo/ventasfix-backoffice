'use strict';

const fs = require('fs');
const request = require('supertest');

const app = require('../../src/app');
const db = require('../../src/models');
const env = require('../../src/config/env.config');
const { truncateAll } = require('../helpers/db.helper');
const { getAuthToken } = require('../helpers/auth.helper');

let token;

beforeEach(async () => {
  await truncateAll();
  ({ token } = await getAuthToken());
});

afterAll(async () => {
  await db.sequelize.close();
});

// Real JPEG signature (FF D8 FF) followed by filler: the upload middleware
// checks the file's magic bytes, so a random buffer no longer passes.
const TEST_IMAGE = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('fake-jpeg-body')]);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Files currently sitting on the upload dir (ignores the .gitkeep placeholder). */
function uploadedFiles() {
  return fs.readdirSync(env.UPLOAD_DIR).filter((name) => !name.startsWith('.'));
}

function baseFields(overrides = {}) {
  return {
    sku: 'SKU-TEST-1',
    name: 'Test product',
    short_description: 'Short description',
    long_description: 'Long description',
    net_price: '12990',
    current_stock: '50',
    minimum_stock: '10',
    low_stock: '20',
    high_stock: '100',
    ...overrides,
  };
}

/** Builds a multipart POST/PUT with every text field plus an attached image, unless `withImage` is false. */
function multipartRequest(req, fields, { withImage = true, imageOptions = {} } = {}) {
  let builder = req.set('Authorization', `Bearer ${token}`);
  Object.entries(fields).forEach(([key, value]) => {
    builder = builder.field(key, String(value));
  });
  if (withImage) {
    builder = builder.attach('image', imageOptions.buffer || TEST_IMAGE, {
      filename: imageOptions.filename || 'product.jpg',
      contentType: imageOptions.contentType || 'image/jpeg',
    });
  }
  return builder;
}

describe('Products CRUD', () => {
  test('GET /api/products returns 200 with a list', async () => {
    const response = await request(app).get('/api/products').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('a client-sent sale_price is rejected outright by the .strict() schema (422)', async () => {
    // docs/adr/ADR-009: sale_price is always derived by the model hook.
    // The validator goes further and refuses the field entirely instead
    // of silently dropping it, so the mistake is visible to the caller.
    const response = await multipartRequest(
      request(app).post('/api/products'),
      baseFields({ sale_price: '1' })
    );

    expect(response.status).toBe(422);
  });

  test('POST /api/products with an image returns 201 with the derived sale_price', async () => {
    const response = await multipartRequest(request(app).post('/api/products'), baseFields());

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/products/${response.body.id}`);
    const expectedSalePrice = (12990 * (1 + env.TAX_RATE)).toFixed(2);
    expect(parseFloat(response.body.sale_price)).toBeCloseTo(parseFloat(expectedSalePrice), 2);
  });

  test('POST /api/products without an image returns 422 on field image', async () => {
    const response = await multipartRequest(request(app).post('/api/products'), baseFields(), {
      withImage: false,
    });

    expect(response.status).toBe(422);
    expect(response.body.error.details.some((detail) => detail.field === 'image')).toBe(true);
  });

  test('POST /api/products with a disallowed MIME type returns 415', async () => {
    const response = await multipartRequest(request(app).post('/api/products'), baseFields(), {
      imageOptions: { buffer: Buffer.from('not an image'), filename: 'notes.txt', contentType: 'text/plain' },
    });

    expect(response.status).toBe(415);
  });

  test('the stored extension comes from the MIME type, never from the original filename', async () => {
    // A ".html" upload declared as image/png must not land as <uuid>.html
    // on the volume: express.static would serve it as text/html (stored XSS).
    const response = await multipartRequest(request(app).post('/api/products'), baseFields(), {
      imageOptions: {
        buffer: Buffer.concat([PNG_SIGNATURE, Buffer.from('<script>alert(1)</script>')]),
        filename: 'evil.html',
        contentType: 'image/png',
      },
    });

    expect(response.status).toBe(201);
    expect(response.body.image_url).toMatch(/\.png$/);
    expect(response.body.image_url).not.toMatch(/\.html/);
  });

  test('a file whose bytes do not match its declared image type returns 415 and is not kept', async () => {
    const before = uploadedFiles().length;

    const response = await multipartRequest(request(app).post('/api/products'), baseFields(), {
      imageOptions: { buffer: Buffer.from('this is plain text, not a png'), filename: 'fake.png', contentType: 'image/png' },
    });

    expect(response.status).toBe(415);
    expect(response.body.error.type).toBe('UnsupportedMediaTypeError');
    expect(uploadedFiles().length).toBe(before);
  });

  test('an upload rejected later in the chain (422 / 409) does not leave an orphan file behind', async () => {
    const before = uploadedFiles().length;

    const invalid = await multipartRequest(request(app).post('/api/products'), baseFields({ name: '' }));
    expect(invalid.status).toBe(422);
    expect(uploadedFiles().length).toBe(before);

    await multipartRequest(request(app).post('/api/products'), baseFields());
    const afterCreate = uploadedFiles().length;
    expect(afterCreate).toBe(before + 1);

    const duplicate = await multipartRequest(request(app).post('/api/products'), baseFields());
    expect(duplicate.status).toBe(409);
    expect(uploadedFiles().length).toBe(afterCreate);
  });

  test.each([
    ['net_price', ''],
    ['net_price', '   '],
    ['current_stock', ''],
    ['minimum_stock', ' '],
  ])('an empty %s (%p) is rejected with 422 instead of being stored as 0', async (field, value) => {
    // "Los métodos de escritura no deben almacenar datos vacíos":
    // Number('') is 0, so plain coercion would silently persist a zero.
    const response = await multipartRequest(request(app).post('/api/products'), baseFields({ [field]: value }));

    expect(response.status).toBe(422);
    expect(response.body.error.details.some((detail) => detail.field === field)).toBe(true);
  });

  test('POST /api/products with a file over MAX_UPLOAD_SIZE returns 413', async () => {
    const oversizedBuffer = Buffer.alloc(env.MAX_UPLOAD_SIZE + 1024, 1);

    const response = await multipartRequest(request(app).post('/api/products'), baseFields(), {
      imageOptions: { buffer: oversizedBuffer },
    });

    expect(response.status).toBe(413);
  });

  test('POST /api/products with minimum_stock > low_stock returns 422', async () => {
    const response = await multipartRequest(
      request(app).post('/api/products'),
      baseFields({ minimum_stock: '50', low_stock: '10', high_stock: '100' })
    );

    expect(response.status).toBe(422);
    expect(response.body.error.details.some((detail) => detail.field === 'minimum_stock')).toBe(true);
  });

  test('GET /api/products/:id returns 404 for a missing id', async () => {
    const response = await request(app).get('/api/products/999999').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  test('POST /api/products with a duplicate sku returns 409', async () => {
    await multipartRequest(request(app).post('/api/products'), baseFields());

    const response = await multipartRequest(request(app).post('/api/products'), baseFields());

    expect(response.status).toBe(409);
    expect(response.body.error.type).toBe('ConflictError');
  });

  test('PUT /api/products/:id without a new image keeps the existing one and updates fields', async () => {
    const created = await multipartRequest(request(app).post('/api/products'), baseFields());

    const response = await request(app)
      .put(`/api/products/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Updated name');

    expect(response.status).toBe(200);
    expect(response.body.name).toBe('Updated name');
    expect(response.body.image_url).toBe(created.body.image_url);
  });

  test('PUT /api/products/:id with a new net_price recalculates sale_price and keeps the response shape', async () => {
    const created = await multipartRequest(request(app).post('/api/products'), baseFields());

    const response = await request(app)
      .put(`/api/products/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`)
      .field('net_price', '2000');

    expect(response.status).toBe(200);
    // DECIMAL columns come back as strings on create/get; update must match.
    expect(response.body.net_price).toBe('2000.00');
    const expectedSalePrice = (2000 * (1 + env.TAX_RATE)).toFixed(2);
    expect(response.body.sale_price).toBe(expectedSalePrice);
  });

  test('PUT /api/products/:id with a new image replaces image_url', async () => {
    const created = await multipartRequest(request(app).post('/api/products'), baseFields());

    const response = await multipartRequest(request(app).put(`/api/products/${created.body.id}`), {});

    expect(response.status).toBe(200);
    expect(response.body.image_url).not.toBe(created.body.image_url);
  });

  test('PUT /api/products/:id on a missing id returns 404', async () => {
    const response = await request(app)
      .put('/api/products/999999')
      .set('Authorization', `Bearer ${token}`)
      .field('name', 'Nobody');

    expect(response.status).toBe(404);
  });

  test('PUT /api/products/:id with an empty body returns 422', async () => {
    const created = await multipartRequest(request(app).post('/api/products'), baseFields());

    const response = await request(app)
      .put(`/api/products/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(422);
  });

  test('DELETE /api/products/:id returns 204, then GET returns 404', async () => {
    const created = await multipartRequest(request(app).post('/api/products'), baseFields());

    const deleteResponse = await request(app)
      .delete(`/api/products/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.body).toEqual({});

    const getResponse = await request(app)
      .get(`/api/products/${created.body.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getResponse.status).toBe(404);
  });

  test('the sku of a deleted product can be reused by a new product (201)', async () => {
    const first = await multipartRequest(request(app).post('/api/products'), baseFields());
    await request(app).delete(`/api/products/${first.body.id}`).set('Authorization', `Bearer ${token}`);

    const second = await multipartRequest(request(app).post('/api/products'), baseFields());

    expect(second.status).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
  });
});
