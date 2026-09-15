'use strict';

/**
 * Base class for every domain error. Services throw these (or a subclass);
 * they never know about HTTP. The one place that translates a domain error
 * into a status code is `middlewares/errorHandler.middleware.js` — the
 * classes here carry only a `type` (their class name) and a message.
 * See docs/adr/ADR-010-errores-de-dominio.md.
 */
class AppError extends Error {
  /**
   * @param {string} message Human-readable message, safe to show to the end user.
   * @param {object[]} [details] Optional per-field details (validation errors).
   */
  constructor(message, details = []) {
    super(message);
    this.name = this.constructor.name;
    this.type = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
