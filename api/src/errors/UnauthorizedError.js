'use strict';

const AppError = require('./AppError');

/** Missing token, expired token, or wrong credentials. */
class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required', details = []) {
    super(message, details);
  }
}

module.exports = UnauthorizedError;
