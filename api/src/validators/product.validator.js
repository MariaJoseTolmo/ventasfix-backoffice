'use strict';

const { registry, z } = require('./openapi.registry');

// Multipart bodies (product create/update always go through multer) arrive
// as strings, so every numeric field is coerced. Plain `z.coerce.number()`
// is NOT enough: `Number('')` and `Number('   ')` are both `0`, so an empty
// form field would be silently stored as a legitimate zero — exactly the
// "datos vacíos" the requirement forbids. Blank strings are turned into
// `undefined` first, so they fail as "required" like any other missing
// field.
function blankToUndefined(value) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

function numericField(name, { integer = false } = {}) {
  let schema = z.coerce.number({ message: `${name} must be a number` });
  if (integer) schema = schema.int(`${name} must be an integer`);
  schema = schema.min(0, `${name} must be greater than or equal to 0`);
  return z.preprocess(blankToUndefined, schema);
}

const skuField = z.string().trim().min(1, 'sku must not be empty').openapi({ example: 'SKU-0001' });
const nameField = z.string().trim().min(1, 'name must not be empty').openapi({ example: 'Wireless Mouse' });
const shortDescriptionField = z
  .string()
  .trim()
  .min(1, 'short_description must not be empty')
  .openapi({ example: 'Ergonomic wireless mouse' });
const longDescriptionField = z
  .string()
  .trim()
  .min(1, 'long_description must not be empty')
  .openapi({ example: 'A comfortable wireless mouse with a rechargeable battery.' });
const netPriceField = numericField('net_price').openapi({ type: 'number', example: 12990 });
const currentStockField = numericField('current_stock', { integer: true }).openapi({ type: 'integer', example: 50 });
const minimumStockField = numericField('minimum_stock', { integer: true }).openapi({ type: 'integer', example: 10 });
const lowStockField = numericField('low_stock', { integer: true }).openapi({ type: 'integer', example: 20 });
const highStockField = numericField('high_stock', { integer: true }).openapi({ type: 'integer', example: 100 });

// `sale_price` is intentionally NOT a field of this schema. Both create and
// update objects below are `.strict()`, so a client sending `sale_price`
// gets a 422 naming that field instead of the value being silently
// dropped: see docs/adr/ADR-009-precio-venta-derivado.md — surfacing the
// mistake is more useful than hiding it, and the model's beforeSave hook
// is the only thing that ever writes this column either way.
const baseProductShape = {
  sku: skuField,
  name: nameField,
  short_description: shortDescriptionField,
  long_description: longDescriptionField,
  net_price: netPriceField,
  current_stock: currentStockField,
  minimum_stock: minimumStockField,
  low_stock: lowStockField,
  high_stock: highStockField,
};

function addStockOrderIssues(data, ctx) {
  if (
    data.minimum_stock !== undefined &&
    data.low_stock !== undefined &&
    data.minimum_stock > data.low_stock
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'minimum_stock must be less than or equal to low_stock',
      path: ['minimum_stock'],
    });
  }

  if (data.low_stock !== undefined && data.high_stock !== undefined && data.low_stock > data.high_stock) {
    ctx.addIssue({
      code: 'custom',
      message: 'low_stock must be less than or equal to high_stock',
      path: ['low_stock'],
    });
  }
}

const createProductSchema = registry.register(
  'CreateProduct',
  z.object(baseProductShape).strict().superRefine(addStockOrderIssues).openapi('CreateProduct')
);

const updateProductSchema = registry.register(
  'UpdateProduct',
  z
    .object(baseProductShape)
    .partial()
    .strict()
    // No "at least one field" refine here, unlike user/client: a product
    // update that only replaces the image is legitimate, and the image
    // never reaches this schema (it travels as `req.file`, not
    // `req.body`). That combined check lives in
    // upload.middleware.js#requireAtLeastOneUpdateField, which sees both.
    //
    // On a partial update the pair-wise check below only fires when both
    // sides of a comparison are present in this request; the third,
    // unsent threshold is validated against the row that comes out of
    // findByPk + set() by the model's stockThresholdsOrdered validator
    // and the DB CHECK constraint (docs/adr/ADR-002, ADR-004 "No hace").
    .superRefine(addStockOrderIssues)
    .openapi('UpdateProduct')
);

// Documentation-only variants of the two schemas above, for Swagger UI.
// The image never reaches Zod (multer moves it to `req.file`), so the
// validating schemas cannot declare it — but without a `format: binary`
// field in the spec, Swagger's "Try it out" shows no file picker and a
// product can never be created from /api-docs. These are registered
// under different names and used ONLY in `registerPath`, never in
// `validate()`.
const imageFileField = z.string().openapi({ type: 'string', format: 'binary' });

const createProductFormSchema = registry.register(
  'CreateProductForm',
  z.object({ ...baseProductShape, image: imageFileField }).openapi('CreateProductForm')
);

const updateProductFormSchema = registry.register(
  'UpdateProductForm',
  z
    .object({ ...baseProductShape, image: imageFileField })
    .partial()
    .openapi('UpdateProductForm')
);

const productResponseSchema = registry.register(
  'ProductResponse',
  z
    .object({
      id: z.number().int().openapi({ example: 1 }),
      sku: z.string().openapi({ example: 'SKU-0001' }),
      name: z.string().openapi({ example: 'Wireless Mouse' }),
      short_description: z.string().openapi({ example: 'Ergonomic wireless mouse' }),
      long_description: z.string().openapi({ example: 'Full product description.' }),
      image_url: z.string().openapi({ example: '3f2a1c9e-....jpg' }),
      net_price: z.string().openapi({ example: '12990.00' }),
      sale_price: z.string().openapi({ example: '15458.10' }),
      current_stock: z.number().int().openapi({ example: 50 }),
      minimum_stock: z.number().int().openapi({ example: 10 }),
      low_stock: z.number().int().openapi({ example: 20 }),
      high_stock: z.number().int().openapi({ example: 100 }),
      created_at: z.string().openapi({ example: '2026-09-14T12:00:00.000Z' }),
      updated_at: z.string().openapi({ example: '2026-09-14T12:00:00.000Z' }),
      deleted_at: z.string().nullable().openapi({ example: null }),
    })
    .openapi('ProductResponse')
);

module.exports = {
  createProductSchema,
  updateProductSchema,
  createProductFormSchema,
  updateProductFormSchema,
  productResponseSchema,
};
