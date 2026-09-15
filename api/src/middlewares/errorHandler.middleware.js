'use strict';

const multer = require('multer');
const { ZodError } = require('zod');
const { UniqueConstraintError, ValidationError: SequelizeValidationError } = require('sequelize');

const {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  PayloadTooLargeError,
  UnsupportedMediaTypeError,
  ExternalServiceError,
} = require('../errors');
const { discardUploadedFile } = require('./upload.middleware');

/**
 * THE mapping between domain errors and HTTP status codes. It lives here
 * and nowhere else (docs/adr/ADR-010, docs/04-CONTRATO-API.md "Códigos de
 * respuesta"): the error classes in `errors/` do not know their status,
 * and no controller ever picks an error status by hand.
 */
const STATUS_BY_ERROR = new Map([
  [BadRequestError, 400],
  [UnauthorizedError, 401],
  [ForbiddenError, 403],
  [NotFoundError, 404],
  [ConflictError, 409],
  [PayloadTooLargeError, 413],
  [UnsupportedMediaTypeError, 415],
  [ValidationError, 422],
  [ExternalServiceError, 502],
]);

function statusFor(domainError) {
  for (const [ErrorClass, status] of STATUS_BY_ERROR) {
    if (domainError instanceof ErrorClass) return status;
  }
  return 500;
}

/**
 * Translates errors thrown by external libraries (body-parser, Multer,
 * Sequelize, Zod) into domain errors BEFORE the table above is applied.
 * Without this step they would fall into the uncontrolled 500 case even
 * though a precise status exists for them. See docs/adr/ADR-010
 * "Errores de librerías externas" and docs/adr/ADR-007 "El choque entre
 * UNIQUE y el borrado lógico".
 */
function normalize(err) {
  // body-parser (express.json / express.urlencoded) tags its errors with a
  // `type`. A body the server cannot even parse is the textbook 400 of
  // docs/04-CONTRATO-API.md "Sobre 422 frente a 400"; an oversized JSON
  // body is the same 413 as an oversized image.
  if (err && err.type === 'entity.parse.failed') {
    return new BadRequestError('The request body is not well-formed');
  }
  if (err && err.type === 'entity.too.large') {
    return new PayloadTooLargeError('The request body exceeds the maximum allowed size');
  }

  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return new PayloadTooLargeError('The uploaded file exceeds the maximum allowed size');
    }
    return new ValidationError('The submitted file is not valid', [
      { field: err.field || 'image', message: err.message },
    ]);
  }

  if (err instanceof UniqueConstraintError) {
    // Race-condition backstop for the service-level uniqueness check: see
    // docs/adr/ADR-007-borrado-logico.md#el-choque-entre-unique-y-el-borrado-lógico.
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'value';
    return new ConflictError(`A record with that ${field} already exists`);
  }

  if (err instanceof SequelizeValidationError) {
    const details = err.errors.map((fieldError) => ({
      field: fieldError.path,
      message: fieldError.message,
    }));
    return new ValidationError('The submitted data is not valid', details);
  }

  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return new ValidationError('The submitted data is not valid', details);
  }

  return err;
}

// eslint-disable-next-line no-unused-vars
async function errorHandler(err, req, res, next) {
  // docs/adr/ADR-008 "Sin transaccionalidad": multer writes the file to
  // the volume before Zod/the service run. If anything after that fails
  // (422, 409, 500...), the file must not stay behind as an orphan.
  if (req.file) {
    await discardUploadedFile(req.file).catch(() => {});
  }

  const domainError = normalize(err);

  if (domainError instanceof AppError) {
    const body = {
      error: {
        type: domainError.type,
        message: domainError.message,
      },
    };

    if (domainError.details && domainError.details.length > 0) {
      body.error.details = domainError.details;
    }

    res.status(statusFor(domainError)).json(body);
    return;
  }

  // Uncontrolled error: log it in full server-side, answer generically
  // (never leak stack traces or driver messages to the client).
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ error: { type: 'InternalServerError', message: 'Unexpected error' } });
}

module.exports = errorHandler;
