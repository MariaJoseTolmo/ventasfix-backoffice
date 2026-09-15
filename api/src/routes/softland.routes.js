'use strict';

const { Router } = require('express');

const authenticate = require('../middlewares/authenticate.middleware');
const softlandController = require('../controllers/softland.controller');
const { registry, z } = require('../validators/openapi.registry');
const { jsonResponse, errorResponses } = require('./openapi.shared');

const router = Router();

router.post('/sync', authenticate, softlandController.sync);

const syncResponseSchema = registry.register(
  'SoftlandSyncResponse',
  z
    .object({
      sent: z.number().int().openapi({ example: 3 }),
      received: z.number().int().openapi({ example: 3 }),
      status: z.string().openapi({ example: 'ok' }),
    })
    .openapi('SoftlandSyncResponse')
);

registry.registerPath({
  method: 'post',
  path: '/api/softland/sync',
  tags: ['Softland'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonResponse('Catalog synced with Softland', syncResponseSchema),
    401: errorResponses[401],
    502: jsonResponse('Softland did not respond', errorResponses[422].content['application/json'].schema),
  },
});

module.exports = router;
