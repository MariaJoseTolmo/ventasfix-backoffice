'use strict';

const { registry, z } = require('./openapi.registry');
const { isValidRut } = require('../utils/rut.util');

// docs/adr/ADR-005 "Reglas de validación": user email must belong to
// @ventasfix.cl, unlike client.contact_email which has no domain restriction.
const VENTASFIX_EMAIL_DOMAIN = /@ventasfix\.cl$/i;

const rutField = z
  .string()
  .trim()
  .min(1, 'rut is required')
  .refine(isValidRut, { message: 'rut must be a valid Chilean RUT (e.g. 12345678-5)' })
  .openapi({ example: '12345678-5' });

const firstNameField = z.string().trim().min(1, 'first_name must not be empty').openapi({ example: 'Ana' });
const lastNameField = z.string().trim().min(1, 'last_name must not be empty').openapi({ example: 'Gomez' });

const emailField = z
  .string()
  .trim()
  .min(1, 'email must not be empty')
  .email('email must be a valid email address')
  .refine((value) => VENTASFIX_EMAIL_DOMAIN.test(value), {
    message: 'email must belong to the @ventasfix.cl domain',
  })
  .openapi({ example: 'ana@ventasfix.cl' });

const passwordField = z
  .string()
  .min(8, 'password must be at least 8 characters long')
  .openapi({ example: 'S3cret!234' });

const createUserSchema = registry.register(
  'CreateUser',
  z
    .object({
      rut: rutField,
      first_name: firstNameField,
      last_name: lastNameField,
      email: emailField,
      password: passwordField,
    })
    .strict()
    .openapi('CreateUser')
);

const updateUserSchema = registry.register(
  'UpdateUser',
  z
    .object({
      rut: rutField,
      first_name: firstNameField,
      last_name: lastNameField,
      email: emailField,
      password: passwordField,
    })
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    })
    .openapi('UpdateUser')
);

const userResponseSchema = registry.register(
  'UserResponse',
  z
    .object({
      id: z.number().int().openapi({ example: 1 }),
      rut: z.string().openapi({ example: '12345678-5' }),
      first_name: z.string().openapi({ example: 'Ana' }),
      last_name: z.string().openapi({ example: 'Gomez' }),
      email: z.string().openapi({ example: 'ana@ventasfix.cl' }),
      created_at: z.string().openapi({ example: '2026-09-14T12:00:00.000Z' }),
      updated_at: z.string().openapi({ example: '2026-09-14T12:00:00.000Z' }),
      deleted_at: z.string().nullable().openapi({ example: null }),
    })
    .openapi('UserResponse')
);

module.exports = { createUserSchema, updateUserSchema, userResponseSchema };
