'use strict';

const { OpenAPIRegistry, extendZodWithOpenApi } = require('@asteasolutions/zod-to-openapi');
const { z } = require('zod');

// Adds the `.openapi()` method to every Zod schema. Must run once, before
// any validator file calls `.openapi(...)`. See docs/adr/ADR-005.
extendZodWithOpenApi(z);

const registry = new OpenAPIRegistry();

registry.registerComponent('securitySchemes', 'bearerAuth', {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
});

module.exports = { registry, z };
