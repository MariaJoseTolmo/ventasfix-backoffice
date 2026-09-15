'use strict';

const AppError = require('./AppError');

/** The uploaded file exceeds MAX_UPLOAD_SIZE. */
class PayloadTooLargeError extends AppError {
  constructor(message = 'The uploaded file is too large', details = []) {
    super(message, details);
  }
}

module.exports = PayloadTooLargeError;
