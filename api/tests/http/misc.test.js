'use strict';

const request = require('supertest');

const app = require('../../src/app');
const db = require('../../src/models');
const { truncateAll } = require('../helpers/db.helper');
const { getAuthToken } = require('../helpers/auth.helper');

beforeEach(truncateAll);

afterAll(async () => {
  await db.sequelize.close();
});

describe('authentication gate', () => {
  test('GET /api/products without a token returns 401', async () => {
    const response = await request(app).get('/api/products');
    expect(response.status).toBe(401);
    expect(response.body.error.type).toBe('UnauthorizedError');
  });

  test('a token signed with alg "none" returns 401', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: 1, email: 'admin@ventasfix.cl' })).toString('base64url');
    const unsignedToken = `${header}.${payload}.`;

    const response = await request(app).get('/api/products').set('Authorization', `Bearer ${unsignedToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.type).toBe('UnauthorizedError');
  });

  test('GET /api/products with a tampered token returns 401', async () => {
    const { token } = await getAuthToken();
    const tampered = `${token}tampered`;

    const response = await request(app).get('/api/products').set('Authorization', `Bearer ${tampered}`);

    expect(response.status).toBe(401);
    expect(response.body.error.type).toBe('UnauthorizedError');
  });
});

describe('malformed request bodies', () => {
  test('a body that is not valid JSON returns 400, not an uncontrolled 500', async () => {
    // docs/04-CONTRATO-API.md "Sobre 422 frente a 400": 400 is reserved for
    // requests the server cannot even interpret.
    const response = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send('{"email": "admin@ventasfix.cl", ');

    expect(response.status).toBe(400);
    expect(response.body.error.type).toBe('BadRequestError');
  });
});

describe('unknown routes', () => {
  test('an unmapped route returns 404 in the standard error format', async () => {
    const response = await request(app).get('/api/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body.error.type).toBe('NotFoundError');
  });
});

describe('GET /api/health', () => {
  test('returns 200', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('Swagger documentation', () => {
  test('GET /api-docs.json returns 200 and includes the 15 CRUD paths', async () => {
    const response = await request(app).get('/api-docs.json');

    expect(response.status).toBe(200);
    const paths = Object.keys(response.body.paths);

    const expectedCrudPaths = [
      ['/api/users', ['get', 'post']],
      ['/api/users/{id}', ['get', 'put', 'delete']],
      ['/api/products', ['get', 'post']],
      ['/api/products/{id}', ['get', 'put', 'delete']],
      ['/api/clients', ['get', 'post']],
      ['/api/clients/{id}', ['get', 'put', 'delete']],
    ];

    let crudOperationCount = 0;
    expectedCrudPaths.forEach(([pathKey, methods]) => {
      expect(paths).toContain(pathKey);
      methods.forEach((method) => {
        expect(response.body.paths[pathKey]).toHaveProperty(method);
        crudOperationCount += 1;
      });
    });

    // 3 entities x 5 REST operations = 15.
    expect(crudOperationCount).toBe(15);
  });

  test('product create/update are documented as multipart with a binary image field', async () => {
    // Without `format: binary` Swagger UI shows no file picker, and since
    // the image is mandatory, no product could ever be created from
    // "Try it out" — which is exactly what the API video demonstrates.
    const response = await request(app).get('/api-docs.json');
    const { schemas } = response.body.components;

    const createBody = response.body.paths['/api/products'].post.requestBody.content['multipart/form-data'];
    expect(createBody.schema).toEqual({ $ref: '#/components/schemas/CreateProductForm' });
    expect(schemas.CreateProductForm.properties.image).toEqual({ type: 'string', format: 'binary' });
    expect(schemas.CreateProductForm.required).toContain('image');

    const updateBody = response.body.paths['/api/products/{id}'].put.requestBody.content['multipart/form-data'];
    expect(updateBody.schema).toEqual({ $ref: '#/components/schemas/UpdateProductForm' });
    expect(schemas.UpdateProductForm.properties.image).toEqual({ type: 'string', format: 'binary' });
  });

  test('every protected operation declares bearerAuth and every error status uses the Error schema', async () => {
    const response = await request(app).get('/api-docs.json');

    Object.entries(response.body.paths).forEach(([pathKey, operations]) => {
      Object.values(operations).forEach((operation) => {
        if (pathKey !== '/api/auth/login') {
          expect(operation.security).toEqual([{ bearerAuth: [] }]);
        }
        Object.entries(operation.responses)
          .filter(([status]) => Number(status) >= 400)
          .forEach(([, errorResponse]) => {
            expect(errorResponse.content['application/json'].schema).toEqual({ $ref: '#/components/schemas/Error' });
          });
      });
    });
  });

  test('GET /api-docs returns 200 HTML', async () => {
    const response = await request(app).get('/api-docs/');
    expect(response.status).toBe(200);
    expect(response.type).toBe('text/html');
  });
});
