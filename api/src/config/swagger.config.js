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
  // A relative server URL keeps "Try it out" on the page's own origin. Hardcoding
  // http://localhost:3000 breaks Swagger when it is reached through the Nginx proxy
  // on port 80: a different port is a different origin, so the request becomes
  // cross-origin and CORS blocks it.
  servers: [{ url: '/', description: 'Same origin as this page' }],
});

module.exports = swaggerDocument;
