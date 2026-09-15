'use strict';

const { registry, z } = require('../validators/openapi.registry');

const errorSchema = registry.register(
  'Error',
  z.object({
    error: z.object({
      type: z.string().openapi({ example: 'ValidationError' }),
      message: z.string().openapi({ example: 'The submitted data is not valid' }),
      details: z
        .array(z.object({ field: z.string(), message: z.string() }))
        .optional()
        .openapi({
          example: [{ field: 'email', message: 'email must belong to the @ventasfix.cl domain' }],
        }),
    }),
  })
);

function jsonResponse(description, schema) {
  return { description, content: { 'application/json': { schema } } };
}

const errorResponses = {
  401: jsonResponse('Missing, invalid or expired token', errorSchema),
  404: jsonResponse('The resource was not found', errorSchema),
  409: jsonResponse('The resource already exists', errorSchema),
  422: jsonResponse('The submitted data is not valid', errorSchema),
};

module.exports = { errorSchema, jsonResponse, errorResponses };
