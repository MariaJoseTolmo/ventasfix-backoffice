'use strict';

const AppError = require('./AppError');

/**
 * Data is syntactically valid but fails a business rule.
 * `details` carries per-field messages so the frontend can highlight the
 * exact field without re-implementing backend validation rules.
 */
class ValidationError extends AppError {
  constructor(message = 'The submitted data is not valid', details = []) {
    super(message, details);
  }
}

module.exports = ValidationError;
