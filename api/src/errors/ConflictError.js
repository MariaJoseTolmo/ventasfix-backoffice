'use strict';

const AppError = require('./AppError');

/** Collides with an existing resource (duplicate email, rut or sku). */
class ConflictError extends AppError {
  constructor(message = 'A record with that value already exists', details = []) {
    super(message, details);
  }
}

module.exports = ConflictError;
