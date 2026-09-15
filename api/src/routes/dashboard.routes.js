'use strict';

const { Router } = require('express');

const authenticate = require('../middlewares/authenticate.middleware');
const dashboardController = require('../controllers/dashboard.controller');
const { registry, z } = require('../validators/openapi.registry');
const { jsonResponse, errorResponses } = require('./openapi.shared');

const router = Router();

router.get('/summary', authenticate, dashboardController.summary);

const summarySchema = registry.register(
  'DashboardSummary',
  z
    .object({
      users: z.number().int().openapi({ example: 4 }),
      products: z.number().int().openapi({ example: 27 }),
      clients: z.number().int().openapi({ example: 12 }),
    })
    .openapi('DashboardSummary')
);

registry.registerPath({
  method: 'get',
  path: '/api/dashboard/summary',
  tags: ['Dashboard'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonResponse('Aggregate counts for users, products and clients', summarySchema),
    401: errorResponses[401],
  },
});

module.exports = router;
