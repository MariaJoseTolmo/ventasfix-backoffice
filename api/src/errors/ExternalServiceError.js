'use strict';

const AppError = require('./AppError');

/** An external service (Softland) failed to respond or returned an error. */
class ExternalServiceError extends AppError {
  constructor(message = 'An external service is unavailable', details = []) {
    super(message, details);
  }
}

module.exports = ExternalServiceError;
