'use strict';

const AppError = require('./AppError');

/** The uploaded file's MIME type is not in ALLOWED_MIME_TYPES. */
class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'The uploaded file type is not supported', details = []) {
    super(message, details);
  }
}

module.exports = UnsupportedMediaTypeError;
