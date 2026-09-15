'use strict';

const { Router } = require('express');

const authenticate = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const userController = require('../controllers/user.controller');
const { createUserSchema, updateUserSchema, userResponseSchema } = require('../validators/user.validator');
const { idParamSchema } = require('../validators/id.validator');
const { registry, z } = require('../validators/openapi.registry');
const { jsonResponse, errorResponses } = require('./openapi.shared');

const router = Router();

router.use(authenticate);

router.get('/', userController.list);
router.get('/:id', validate({ params: idParamSchema }), userController.getById);
router.post('/', validate({ body: createUserSchema }), userController.create);
router.put('/:id', validate({ params: idParamSchema, body: updateUserSchema }), userController.update);
router.delete('/:id', validate({ params: idParamSchema }), userController.remove);

const tags = ['Users'];
const security = [{ bearerAuth: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/users',
  tags,
  security,
  responses: {
    200: jsonResponse('List of users', z.array(userResponseSchema)),
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/users/{id}',
  tags,
  security,
  request: { params: idParamSchema },
  responses: {
    200: jsonResponse('The user', userResponseSchema),
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/users',
  tags,
  security,
  request: { body: { content: { 'application/json': { schema: createUserSchema } } } },
  responses: {
    201: jsonResponse('User created', userResponseSchema),
    401: errorResponses[401],
    409: errorResponses[409],
    422: errorResponses[422],
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/users/{id}',
  tags,
  security,
  request: {
    params: idParamSchema,
    body: { content: { 'application/json': { schema: updateUserSchema } } },
  },
  responses: {
    200: jsonResponse('User updated', userResponseSchema),
    401: errorResponses[401],
    404: errorResponses[404],
    409: errorResponses[409],
    422: errorResponses[422],
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/users/{id}',
  tags,
  security,
  request: { params: idParamSchema },
  responses: {
    204: { description: 'User deleted' },
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

module.exports = router;
