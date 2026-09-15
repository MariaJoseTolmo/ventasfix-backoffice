'use strict';

const { registry, z } = require('./openapi.registry');

const loginSchema = registry.register(
  'Login',
  z
    .object({
      email: z.string().trim().min(1, 'email must not be empty').email('email must be a valid email address'),
      password: z.string().min(1, 'password must not be empty'),
    })
    .strict()
    .openapi('Login', { example: { email: 'admin@ventasfix.cl', password: 'Admin.2026' } })
);

module.exports = { loginSchema };
