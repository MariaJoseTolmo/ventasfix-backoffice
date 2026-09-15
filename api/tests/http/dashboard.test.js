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

describe('GET /api/dashboard/summary', () => {
  test('returns 200 with the three counts', async () => {
    await db.Product.create({
      sku: 'SKU-DASH-1',
      name: 'Dashboard product',
      shortDescription: 'Short',
      longDescription: 'Long',
      imageUrl: 'seed/dash.jpg',
      netPrice: 100,
      currentStock: 10,
      minimumStock: 1,
      lowStock: 5,
      highStock: 20,
    });
    await db.Client.create({
      companyRut: '76123456-0',
      industry: 'Retail',
      legalName: 'Dashboard Client SpA',
      phone: '+56911112222',
      address: 'Test address',
      contactName: 'Contact',
      contactEmail: 'contact@dashboard.cl',
    });

    const response = await authed(request(app).get('/api/dashboard/summary'));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ users: 1, products: 1, clients: 1 });
  });

  test('the count decreases by one after a delete', async () => {
    const client = await db.Client.create({
      companyRut: '76123456-0',
      industry: 'Retail',
      legalName: 'Dashboard Client SpA',
      phone: '+56911112222',
      address: 'Test address',
      contactName: 'Contact',
      contactEmail: 'contact@dashboard.cl',
    });

    const before = await authed(request(app).get('/api/dashboard/summary'));
    expect(before.body.clients).toBe(1);

    await authed(request(app).delete(`/api/clients/${client.id}`));

    const after = await authed(request(app).get('/api/dashboard/summary'));
    expect(after.body.clients).toBe(0);
  });

  test('without a token returns 401', async () => {
    const response = await request(app).get('/api/dashboard/summary');
    expect(response.status).toBe(401);
  });
});
