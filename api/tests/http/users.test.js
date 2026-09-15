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

function validUserPayload(overrides = {}) {
  return {
    rut: '76123456-0',
    first_name: 'Bea',
    last_name: 'Lopez',
    email: 'bea@ventasfix.cl',
    password: 'S3cret!234',
    ...overrides,
  };
}

describe('Users CRUD', () => {
  test('GET /api/users returns 200 with a list', async () => {
    const response = await authed(request(app).get('/api/users'));
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    // the admin user created in beforeEach.
    expect(response.body.length).toBeGreaterThanOrEqual(1);
  });

  test('GET /api/users/:id returns 200 for an existing user', async () => {
    const created = await authed(request(app).post('/api/users').send(validUserPayload()));

    const response = await authed(request(app).get(`/api/users/${created.body.id}`));

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('bea@ventasfix.cl');
  });

  test('GET /api/users/:id returns 404 for a missing id', async () => {
    const response = await authed(request(app).get('/api/users/999999'));
    expect(response.status).toBe(404);
    expect(response.body.error.type).toBe('NotFoundError');
  });

  test('POST /api/users with a valid body returns 201 with a Location header', async () => {
    const response = await authed(request(app).post('/api/users').send(validUserPayload()));

    expect(response.status).toBe(201);
    expect(response.headers.location).toBe(`/api/users/${response.body.id}`);
    expect(response.body.email).toBe('bea@ventasfix.cl');
    expect(response.body.password).toBeUndefined();
  });

  test('POST /api/users with an empty required field returns 422 naming the field', async () => {
    const response = await authed(request(app).post('/api/users').send(validUserPayload({ first_name: '' })));

    expect(response.status).toBe(422);
    expect(response.body.error.details.some((detail) => detail.field === 'first_name')).toBe(true);
  });

  test('POST /api/users with a duplicate email returns 409', async () => {
    await authed(request(app).post('/api/users').send(validUserPayload()));

    const response = await authed(
      request(app).post('/api/users').send(validUserPayload({ rut: '77987654-3' }))
    );

    expect(response.status).toBe(409);
    expect(response.body.error.type).toBe('ConflictError');
  });

  test('PUT /api/users/:id updates the user and returns 200', async () => {
    const created = await authed(request(app).post('/api/users').send(validUserPayload()));

    const response = await authed(
      request(app).put(`/api/users/${created.body.id}`).send({ first_name: 'Beatriz' })
    );

    expect(response.status).toBe(200);
    expect(response.body.first_name).toBe('Beatriz');
  });

  test('PUT /api/users/:id on a missing id returns 404', async () => {
    const response = await authed(request(app).put('/api/users/999999').send({ first_name: 'Nobody' }));
    expect(response.status).toBe(404);
  });

  test('PUT /api/users/:id with an empty body returns 422', async () => {
    const created = await authed(request(app).post('/api/users').send(validUserPayload()));

    const response = await authed(request(app).put(`/api/users/${created.body.id}`).send({}));

    expect(response.status).toBe(422);
  });

  test('DELETE /api/users/:id returns 204 with no body, then GET returns 404', async () => {
    const created = await authed(request(app).post('/api/users').send(validUserPayload()));

    const deleteResponse = await authed(request(app).delete(`/api/users/${created.body.id}`));
    expect(deleteResponse.status).toBe(204);
    expect(deleteResponse.body).toEqual({});

    const getResponse = await authed(request(app).get(`/api/users/${created.body.id}`));
    expect(getResponse.status).toBe(404);
  });

  test('an email outside @ventasfix.cl returns 422 on field email', async () => {
    const response = await authed(
      request(app).post('/api/users').send(validUserPayload({ email: 'bea@gmail.com' }))
    );

    expect(response.status).toBe(422);
    expect(response.body.error.details.some((detail) => detail.field === 'email')).toBe(true);
  });

  test('a rut with a bad check digit returns 422 on field rut', async () => {
    const response = await authed(
      request(app).post('/api/users').send(validUserPayload({ rut: '76123456-9' }))
    );

    expect(response.status).toBe(422);
    expect(response.body.error.details.some((detail) => detail.field === 'rut')).toBe(true);
  });

  test('password (neither plain text nor hash) never appears in list, getById, create or update responses', async () => {
    // The plain-text check alone would never catch a leaked bcrypt hash, so
    // every response is also asserted not to carry the `password` key at all.
    const created = await authed(request(app).post('/api/users').send(validUserPayload()));
    expect(JSON.stringify(created.body)).not.toContain(validUserPayload().password);
    expect(created.body).not.toHaveProperty('password');

    const listResponse = await authed(request(app).get('/api/users'));
    expect(JSON.stringify(listResponse.body)).not.toContain(validUserPayload().password);
    listResponse.body.forEach((user) => expect(user).not.toHaveProperty('password'));

    const getResponse = await authed(request(app).get(`/api/users/${created.body.id}`));
    expect(JSON.stringify(getResponse.body)).not.toContain(validUserPayload().password);
    expect(getResponse.body).not.toHaveProperty('password');

    const updateResponse = await authed(
      request(app).put(`/api/users/${created.body.id}`).send({ first_name: 'Beatriz' })
    );
    expect(JSON.stringify(updateResponse.body)).not.toContain(validUserPayload().password);
    expect(updateResponse.body).not.toHaveProperty('password');

    // Updating the password itself is the one `save()` path where the
    // instance is re-hydrated with the (hashed) password after the write.
    const passwordUpdate = await authed(
      request(app).put(`/api/users/${created.body.id}`).send({ password: 'N3wSecret!234' })
    );
    expect(passwordUpdate.status).toBe(200);
    expect(JSON.stringify(passwordUpdate.body)).not.toContain('N3wSecret!234');
    expect(JSON.stringify(passwordUpdate.body)).not.toMatch(/\$2b\$/);
    expect(passwordUpdate.body).not.toHaveProperty('password');
  });

  test('the email of a deleted user can be reused by a new user (201)', async () => {
    const email = 'reuse-http@ventasfix.cl';
    const first = await authed(request(app).post('/api/users').send(validUserPayload({ email })));
    expect(first.status).toBe(201);

    await authed(request(app).delete(`/api/users/${first.body.id}`));

    const second = await authed(
      request(app).post('/api/users').send(validUserPayload({ email, rut: '77987654-3' }))
    );

    expect(second.status).toBe(201);
    expect(second.body.id).not.toBe(first.body.id);
  });
});
