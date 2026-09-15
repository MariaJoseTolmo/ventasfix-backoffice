'use strict';

const AppError = require('./AppError');

/**
 * The request could not even be interpreted (e.g. a malformed JSON body).
 * Distinct from ValidationError (422), which is for
 * well-formed bodies that break a business rule — see
 * docs/04-CONTRATO-API.md "Sobre 422 frente a 400".
 */
class BadRequestError extends AppError {
  constructor(message = 'The request could not be interpreted', details = []) {
    super(message, details);
  }
}

module.exports = BadRequestError;
