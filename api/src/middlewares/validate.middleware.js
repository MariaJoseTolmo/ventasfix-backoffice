'use strict';

const { ZodError } = require('zod');
const { ValidationError } = require('../errors');

function mapIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Applies Zod schemas to `req.body` / `req.params` / `req.query` and
 * throws a domain `ValidationError` (422) with per-field details on
 * failure. See docs/adr/ADR-005.
 *
 * `req.body` and `req.params` are replaced with the parsed (and coerced)
 * result, so downstream code sees `req.params.id` as a number, etc.
 *
 * `req.query` is validated but NOT reassigned: Express 5 defines
 * `req.query` as a getter with no setter (lib/request.js), so
 * `req.query = ...` throws `TypeError: Cannot set property query`. No
 * route in this API currently declares a `query` schema, but the option
 * is kept for completeness.
 */
function validate({ body, params, query } = {}) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      if (query) {
        query.parse(req.query);
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new ValidationError('The submitted data is not valid', mapIssues(err)));
        return;
      }
      next(err);
    }
  };
}

module.exports = validate;
