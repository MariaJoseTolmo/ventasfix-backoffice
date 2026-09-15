'use strict';

const request = require('supertest');

const app = require('../../src/app');
const db = require('../../src/models');
const { truncateAll } = require('../helpers/db.helper');
const { getAuthToken, ADMIN_CREDENTIALS } = require('../helpers/auth.helper');

beforeEach(truncateAll);

afterAll(async () => {
  await db.sequelize.close();
});

describe('POST /api/auth/login', () => {
  test('correct credentials return 200 with a token and the user, without the password', async () => {
    await db.User.create(ADMIN_CREDENTIALS);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });

    expect(response.status).toBe(200);
    expect(typeof response.body.token).toBe('string');
    expect(response.body.user.email).toBe(ADMIN_CREDENTIALS.email);
    expect(response.body.user.password).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain(ADMIN_CREDENTIALS.password);
  });

  test('wrong password returns 401', async () => {
    await db.User.create(ADMIN_CREDENTIALS);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: 'WrongPassword1!' });

    expect(response.status).toBe(401);
    expect(response.body.error.type).toBe('UnauthorizedError');
  });

  test('nonexistent email returns 401 with the same message as a wrong password', async () => {
    await db.User.create(ADMIN_CREDENTIALS);

    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: 'WrongPassword1!' });

    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@ventasfix.cl', password: 'WrongPassword1!' });

    expect(unknownEmail.status).toBe(401);
    expect(unknownEmail.body.error.message).toBe(wrongPassword.body.error.message);
  });

  test('an invalid body (missing password) returns 422', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: ADMIN_CREDENTIALS.email });

    expect(response.status).toBe(422);
    expect(response.body.error.type).toBe('ValidationError');
  });
});

describe('GET /api/auth/me', () => {
  test('returns the authenticated user without the password', async () => {
    await db.User.create(ADMIN_CREDENTIALS);
    const { token } = await getAuthToken();

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe(ADMIN_CREDENTIALS.email);
    expect(response.body.password).toBeUndefined();
  });

  test('without a token returns 401', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
  });
});
