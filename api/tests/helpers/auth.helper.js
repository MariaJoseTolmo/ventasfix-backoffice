'use strict';

const jwt = require('jsonwebtoken');

const env = require('../../src/config/env.config');
const db = require('../../src/models');

const ADMIN_CREDENTIALS = {
  rut: '12345678-5',
  firstName: 'System',
  lastName: 'Administrator',
  email: 'admin@ventasfix.cl',
  password: 'Admin.2026',
};

/**
 * Ensures the admin user exists (creating it if a previous test truncated
 * the table) and returns a valid Bearer token plus the user row.
 *
 * The token is signed directly with `jsonwebtoken`, the same way
 * auth.service.js does it, instead of going through `POST /api/auth/login`.
 * That endpoint is rate-limited to 10 requests / 15 min per IP
 * (docs/02-ARQUITECTURA.md "Seguridad"), and a full HTTP suite calling
 * this helper from every `beforeEach` would blow through that limit from
 * supertest's single "IP" long before the suite finishes. The login flow
 * itself — including the rate limiter — is still exercised for real in
 * tests/http/auth.test.js, which stays well under the 10-request budget.
 */
async function getAuthToken() {
  const [user] = await db.User.findOrCreate({
    where: { email: ADMIN_CREDENTIALS.email },
    defaults: ADMIN_CREDENTIALS,
  });

  const token = jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, user };
}

module.exports = { getAuthToken, ADMIN_CREDENTIALS };
