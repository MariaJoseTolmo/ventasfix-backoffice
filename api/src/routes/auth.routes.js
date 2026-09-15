'use strict';

const { Router } = require('express');
const rateLimit = require('express-rate-limit');

const authenticate = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const authController = require('../controllers/auth.controller');
const { loginSchema } = require('../validators/auth.validator');
const { userResponseSchema } = require('../validators/user.validator');
const { registry, z } = require('../validators/openapi.registry');
const { jsonResponse, errorResponses } = require('./openapi.shared');

const router = Router();

// docs/02-ARQUITECTURA.md "Seguridad": brute-force protection on login.
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler(req, res) {
    res.status(429).json({
      error: { type: 'TooManyRequestsError', message: 'Too many login attempts, try again later' },
    });
  },
});

router.post('/login', loginRateLimiter, validate({ body: loginSchema }), authController.login);
router.get('/me', authenticate, authController.me);

const loginResponseSchema = registry.register(
  'LoginResponse',
  z.object({ token: z.string(), user: userResponseSchema }).openapi('LoginResponse')
);

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  request: { body: { content: { 'application/json': { schema: loginSchema } } } },
  responses: {
    200: jsonResponse('Login successful', loginResponseSchema),
    401: errorResponses[401],
    422: errorResponses[422],
    429: jsonResponse('Too many login attempts', errorResponses[422].content['application/json'].schema),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  security: [{ bearerAuth: [] }],
  responses: {
    200: jsonResponse('The authenticated user', userResponseSchema),
    401: errorResponses[401],
  },
});

module.exports = router;
