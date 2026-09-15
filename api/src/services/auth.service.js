'use strict';

const jwt = require('jsonwebtoken');

const db = require('../models');
const env = require('../config/env.config');
const { UnauthorizedError, NotFoundError } = require('../errors');
const { toSnakeCaseKeys } = require('../utils/case.util');

const { User } = db;

// Same message whichever branch fails, so the response never reveals
// whether the email exists (docs/adr/ADR-003).
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

async function login(email, password) {
  // `withPassword`: the only scope allowed to read the hash, and only
  // from this one call site.
  const user = await User.scope('withPassword').findOne({ where: { email } });
  if (!user) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }

  const passwordMatches = await user.comparePassword(password);
  if (!passwordMatches) {
    throw new UnauthorizedError(INVALID_CREDENTIALS_MESSAGE);
  }

  const token = signToken(user);
  const { password: _passwordHash, ...publicFields } = user.toJSON();

  return { token, user: toSnakeCaseKeys(publicFields) };
}

async function me(userId) {
  // defaultScope already excludes password.
  const user = await User.findByPk(userId);
  if (!user) throw new NotFoundError('User not found');
  return toSnakeCaseKeys(user.toJSON());
}

module.exports = { login, me };
