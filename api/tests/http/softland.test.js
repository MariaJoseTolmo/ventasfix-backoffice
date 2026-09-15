'use strict';

/**
 * Decision: mock `axios` with `jest.mock` instead of bringing up
 * `softland-mock` via `docker compose up -d` in a global setup.
 *
 * Why: `npm test` runs on the host (see tests/jest.global-setup.js,
 * which only requires PostgreSQL), not inside the Docker network, and
 * `.env`'s SOFTLAND_BASE_URL is the compose service hostname
 * ("http://softland-mock:4000"), unreachable from the host. Wiring a
 * second, host-reachable URL just for tests would duplicate
 * configuration that the adapter already owns. Mocking axios keeps the
 * suite hermetic (no extra container, no port clash, no flakiness from a
 * cold-starting service) while still exercising the real adapter
 * translation logic and the real 200/502 branches through the actual
 * HTTP route. The mock's own translation math is intentionally NOT
 * duplicated here — see docs/adr/ADR-006 — this only checks the branches
 * of `softland.service.sync()`.
 */
const mockSoftlandClient = { get: jest.fn(), post: jest.fn() };

jest.mock('axios', () => ({
  create: jest.fn(() => mockSoftlandClient),
}));

const request = require('supertest');

const app = require('../../src/app');
const db = require('../../src/models');
const { truncateAll } = require('../helpers/db.helper');
const { getAuthToken } = require('../helpers/auth.helper');

let token;

beforeEach(async () => {
  await truncateAll();
  ({ token } = await getAuthToken());
  mockSoftlandClient.get.mockReset();
  mockSoftlandClient.post.mockReset();
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('POST /api/softland/sync', () => {
  test('returns 200 with sent/received when Softland responds', async () => {
    await db.Product.create({
      sku: 'SKU-SYNC-1',
      name: 'Sync product',
      shortDescription: 'Short',
      longDescription: 'Long',
      imageUrl: 'seed/sync.jpg',
      netPrice: 1000,
      currentStock: 5,
      minimumStock: 1,
      lowStock: 3,
      highStock: 10,
    });

    mockSoftlandClient.post.mockResolvedValue({ data: { received: 1, status: 'ok' } });

    const response = await request(app).post('/api/softland/sync').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ sent: 1, received: 1, status: 'ok' });
    expect(mockSoftlandClient.post).toHaveBeenCalledWith(
      '/api/products/sync',
      expect.arrayContaining([expect.objectContaining({ codigo: 'SKU-SYNC-1' })])
    );
  });

  test('returns 502 when Softland does not respond', async () => {
    mockSoftlandClient.post.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const response = await request(app).post('/api/softland/sync').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(502);
    expect(response.body.error.type).toBe('ExternalServiceError');
  });

  test('without a token returns 401', async () => {
    const response = await request(app).post('/api/softland/sync');
    expect(response.status).toBe(401);
  });
});
