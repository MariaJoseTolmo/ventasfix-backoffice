'use strict';

const jwt = require('jsonwebtoken');

const env = require('../config/env.config');
const { UnauthorizedError } = require('../errors');

const BEARER_PREFIX = 'Bearer ';

/**
 * Single authentication gate for both the backoffice and Softland
 * (docs/adr/ADR-003). Verifies the JWT and sets `req.user = { id, email }`.
 */
function authenticate(req, res, next) {
  const header = req.get('Authorization');

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(new UnauthorizedError('A valid Authorization Bearer token is required'));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();

  try {
    // Pinning the algorithm closes the `alg` confusion class of attacks:
    // a token claiming `none` or an asymmetric algorithm is rejected
    // outright instead of being evaluated against the HMAC secret.
    const payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch (err) {
    next(new UnauthorizedError('The provided token is invalid or has expired'));
  }
}

module.exports = authenticate;
