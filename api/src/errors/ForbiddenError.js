'use strict';

const AppError = require('./AppError');

/** Authenticated, but not allowed to perform this operation. */
class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action', details = []) {
    super(message, details);
  }
}

module.exports = ForbiddenError;
