'use strict';

const { Router } = require('express');

const authenticate = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const clientController = require('../controllers/client.controller');
const { createClientSchema, updateClientSchema, clientResponseSchema } = require('../validators/client.validator');
const { idParamSchema } = require('../validators/id.validator');
const { registry, z } = require('../validators/openapi.registry');
const { jsonResponse, errorResponses } = require('./openapi.shared');

const router = Router();

router.use(authenticate);

router.get('/', clientController.list);
router.get('/:id', validate({ params: idParamSchema }), clientController.getById);
router.post('/', validate({ body: createClientSchema }), clientController.create);
router.put('/:id', validate({ params: idParamSchema, body: updateClientSchema }), clientController.update);
router.delete('/:id', validate({ params: idParamSchema }), clientController.remove);

const tags = ['Clients'];
const security = [{ bearerAuth: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/clients',
  tags,
  security,
  responses: {
    200: jsonResponse('List of clients', z.array(clientResponseSchema)),
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/clients/{id}',
  tags,
  security,
  request: { params: idParamSchema },
  responses: {
    200: jsonResponse('The client', clientResponseSchema),
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/clients',
  tags,
  security,
  request: { body: { content: { 'application/json': { schema: createClientSchema } } } },
  responses: {
    201: jsonResponse('Client created', clientResponseSchema),
    401: errorResponses[401],
    409: errorResponses[409],
    422: errorResponses[422],
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/clients/{id}',
  tags,
  security,
  request: {
    params: idParamSchema,
    body: { content: { 'application/json': { schema: updateClientSchema } } },
  },
  responses: {
    200: jsonResponse('Client updated', clientResponseSchema),
    401: errorResponses[401],
    404: errorResponses[404],
    409: errorResponses[409],
    422: errorResponses[422],
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/clients/{id}',
  tags,
  security,
  request: { params: idParamSchema },
  responses: {
    204: { description: 'Client deleted' },
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

module.exports = router;
