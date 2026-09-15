'use strict';

const { z } = require('./openapi.registry');

/**
 * Shared `:id` route param schema. `z.coerce.number()` is required because
 * every value coming from `req.params` is a string.
 */
const idParamSchema = z.object({
  id: z.coerce.number().int().positive().openapi({ example: 1 }),
});

module.exports = { idParamSchema };
