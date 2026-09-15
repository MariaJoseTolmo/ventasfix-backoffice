'use strict';

const { OpenApiGeneratorV3 } = require('@asteasolutions/zod-to-openapi');

const { registry } = require('../validators/openapi.registry');

// Loading the route files registers every path on `registry` as a
// side-effect (docs/adr/ADR-005). Requiring them here, once, is what makes
// `/api-docs` and `/api-docs.json` reflect the exact same schemas the
// validate.middleware uses.
require('../routes');

const generator = new OpenApiGeneratorV3(registry.definitions);

const swaggerDocument = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'VentasFix API',
    version: '1.0.0',
    description: 'REST API for the VentasFix backoffice: users, products, clients, auth, dashboard and the Softland integration.',
  },
  servers: [{ url: 'http://localhost:3000' }],
});

module.exports = swaggerDocument;
