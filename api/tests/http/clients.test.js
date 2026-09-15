'use strict';

const request = require('supertest');

const app = require('../../src/app');
const db = require('../../src/models');
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

function authed(req) {
  return req.set('Authorization', `Bearer ${token}`);
}

function validClientPayload(overrides = {}) {
  return {
    company_rut: '76123456-0',
    industry: 'Retail',
    legal_name: 'Comercial Andes SpA',
    phone: '+56912345678',
    address: 'Av. Providencia 1234, Santiago',
    contact_name: 'Maria Perez',
    contact_email: 'maria.perez@comercialandes.cl',
    ...overrides,
  };
}

describe('Clients CRUD', () => {
  test('GET /api/clients returns 200 with a list', async () => {
    const response = await authed(request(app).get('/api/clients'));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('GET /api/clients/:id returns 200 for an existing client', async () => {
    const created = await authed(request(app).post('/api/clients').send(validClientPayload()));

    const response = await authed(request(app).get(`/api/clients/${created.body.id}`));

    expect(response.status).toBe(200);
    expect(response.body.legal_name).toBe('Comercial Andes SpA');
  });

  test('GET /api/clients/:id returns 404 for a missing id', async () => {
    const response = await authed(request(app).get('/api/clients/999999'));
    expect(response.status).toBe(404);
  });

  test('POST /api/clients with a valid body returns 201 with a Location header', async () => {
    const response = await authed(request(app).post('/api/clients').send(validClientPayload()));

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/clients/${response.body.id}`);
  });

  test('POST /api/clients with an empty required field returns 422', async () => {
    const response = await authed(
      request(app).post('/api/clients').send(validClientPayload({ legal_name: '' }))
    );

    expect(response.status).toBe(422);
    expect(response.body.error.details.some((detail) => detail.field === 'legal_name')).toBe(true);
  });

  test('POST /api/clients with a duplicate company_rut returns 409', async () => {
    await authed(request(app).post('/api/clients').send(validClientPayload()));

    const response = await authed(
      request(app).post('/api/clients').send(validClientPayload({ legal_name: 'Another SpA' }))
    );

    expect(response.status).toBe(409);
    expect(response.body.error.type).toBe('ConflictError');
  });

  test('PUT /api/clients/:id updates the client and returns 200', async () => {
    const created = await authed(request(app).post('/api/clients').send(validClientPayload()));

    const response = await authed(
      request(app).put(`/api/clients/${created.body.id}`).send({ industry: 'Manufacturing' })
    );

    expect(response.status).toBe(200);
    expect(response.body.industry).toBe('Manufacturing');
  });

  test('PUT /api/clients/:id on a missing id returns 404', async () => {
    const response = await authed(request(app).put('/api/clients/999999').send({ industry: 'Retail' }));
    expect(response.status).toBe(404);
  });

  test('PUT /api/clients/:id with an empty body returns 422', async () => {
    const created = await authed(request(app).post('/api/clients').send(validClientPayload()));

    const response = await authed(request(app).put(`/api/clients/${created.body.id}`).send({}));
    expect(response.status).toBe(422);
  });

  test('DELETE /api/clients/:id returns 204, then GET returns 404', async () => {
    const created = await authed(request(app).post('/api/clients').send(validClientPayload()));

    const deleteResponse = await authed(request(app).delete(`/api/clients/${created.body.id}`));
    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.body).toEqual({});

    const getResponse = await authed(request(app).get(`/api/clients/${created.body.id}`));
    expect(getResponse.status).toBe(404);
  });

  test('company_rut with a bad check digit returns 422', async () => {
    const response = await authed(
      request(app).post('/api/clients').send(validClientPayload({ company_rut: '76123456-9' }))
    );

    expect(response.status).toBe(422);
    expect(response.body.error.details.some((detail) => detail.field === 'company_rut')).toBe(true);
  });

  test('contact_email accepts any domain (no @ventasfix.cl restriction)', async () => {
    const response = await authed(
      request(app).post('/api/clients').send(validClientPayload({ contact_email: 'external@anydomain.com' }))
    );

    expect(response.status).toBe(201);
  });

  test('the company_rut of a deleted client can be reused by a new client (201)', async () => {
    const first = await authed(request(app).post('/api/clients').send(validClientPayload()));
    await authed(request(app).delete(`/api/clients/${first.body.id}`));

    const second = await authed(
      request(app).post('/api/clients').send(validClientPayload({ legal_name: 'New Owner SpA' }))
    );

    expect(second.status).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
  });
});
