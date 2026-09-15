'use strict';

const { registry, z } = require('./openapi.registry');
const { isValidRut } = require('../utils/rut.util');

const companyRutField = z
  .string()
  .trim()
  .min(1, 'company_rut is required')
  .refine(isValidRut, { message: 'company_rut must be a valid Chilean RUT (e.g. 76123456-0)' })
  .openapi({ example: '76123456-0' });

const industryField = z.string().trim().min(1, 'industry must not be empty').openapi({ example: 'Retail' });
const legalNameField = z
  .string()
  .trim()
  .min(1, 'legal_name must not be empty')
  .openapi({ example: 'Comercial Andes SpA' });
const phoneField = z.string().trim().min(1, 'phone must not be empty').openapi({ example: '+56912345678' });
const addressField = z
  .string()
  .trim()
  .min(1, 'address must not be empty')
  .openapi({ example: 'Av. Providencia 1234, Santiago' });
const contactNameField = z
  .string()
  .trim()
  .min(1, 'contact_name must not be empty')
  .openapi({ example: 'Maria Perez' });

// No domain restriction here, unlike users.email: contacts are external to
// VentasFix. See docs/adr/ADR-005 "Reglas de validación".
const contactEmailField = z
  .string()
  .trim()
  .min(1, 'contact_email must not be empty')
  .email('contact_email must be a valid email address')
  .openapi({ example: 'maria.perez@comercialandes.cl' });

const baseClientShape = {
  company_rut: companyRutField,
  industry: industryField,
  legal_name: legalNameField,
  phone: phoneField,
  address: addressField,
  contact_name: contactNameField,
  contact_email: contactEmailField,
};

const createClientSchema = registry.register(
  'CreateClient',
  z.object(baseClientShape).strict().openapi('CreateClient')
);

const updateClientSchema = registry.register(
  'UpdateClient',
  z
    .object(baseClientShape)
    .partial()
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided',
    })
    .openapi('UpdateClient')
);

const clientResponseSchema = registry.register(
  'ClientResponse',
  z
    .object({
      id: z.number().int().openapi({ example: 1 }),
      company_rut: z.string().openapi({ example: '76123456-0' }),
      industry: z.string().openapi({ example: 'Retail' }),
      legal_name: z.string().openapi({ example: 'Comercial Andes SpA' }),
      phone: z.string().openapi({ example: '+56912345678' }),
      address: z.string().openapi({ example: 'Av. Providencia 1234, Santiago' }),
      contact_name: z.string().openapi({ example: 'Maria Perez' }),
      contact_email: z.string().openapi({ example: 'maria.perez@comercialandes.cl' }),
      created_at: z.string().openapi({ example: '2026-09-14T12:00:00.000Z' }),
      updated_at: z.string().openapi({ example: '2026-09-14T12:00:00.000Z' }),
      deleted_at: z.string().nullable().openapi({ example: null }),
    })
    .openapi('ClientResponse')
);

module.exports = { createClientSchema, updateClientSchema, clientResponseSchema };
