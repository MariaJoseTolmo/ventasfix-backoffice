'use strict';

const AppError = require('./AppError');

/** The requested resource does not exist. */
class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found', details = []) {
    super(message, details);
  }
}

module.exports = NotFoundError;
