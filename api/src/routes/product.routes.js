'use strict';

const { Router } = require('express');

const authenticate = require('../middlewares/authenticate.middleware');
const validate = require('../middlewares/validate.middleware');
const {
  uploadProductImage,
  requireProductImage,
  requireAtLeastOneUpdateField,
} = require('../middlewares/upload.middleware');
const productController = require('../controllers/product.controller');
const {
  createProductSchema,
  updateProductSchema,
  createProductFormSchema,
  updateProductFormSchema,
  productResponseSchema,
} = require('../validators/product.validator');
const { idParamSchema } = require('../validators/id.validator');
const { registry, z } = require('../validators/openapi.registry');
const { jsonResponse, errorResponses, errorSchema } = require('./openapi.shared');

const router = Router();

router.use(authenticate);

router.get('/', productController.list);
router.get('/:id', validate({ params: idParamSchema }), productController.getById);

// Multer parses the multipart body before Zod validates it
// (docs/02-ARQUITECTURA.md "Recorrido de una petición").
router.post(
  '/',
  uploadProductImage,
  requireProductImage,
  validate({ body: createProductSchema }),
  productController.create
);

router.put(
  '/:id',
  uploadProductImage,
  requireAtLeastOneUpdateField,
  validate({ params: idParamSchema, body: updateProductSchema }),
  productController.update
);

router.delete('/:id', validate({ params: idParamSchema }), productController.remove);

const tags = ['Products'];
const security = [{ bearerAuth: [] }];

registry.registerPath({
  method: 'get',
  path: '/api/products',
  tags,
  security,
  responses: {
    200: jsonResponse('List of products', z.array(productResponseSchema)),
    401: errorResponses[401],
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/products/{id}',
  tags,
  security,
  request: { params: idParamSchema },
  responses: {
    200: jsonResponse('The product', productResponseSchema),
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/products',
  tags,
  security,
  request: {
    body: { content: { 'multipart/form-data': { schema: createProductFormSchema } } },
  },
  responses: {
    201: jsonResponse('Product created', productResponseSchema),
    401: errorResponses[401],
    409: errorResponses[409],
    413: jsonResponse('The uploaded image is too large', errorSchema),
    415: jsonResponse('Unsupported image type', errorSchema),
    422: errorResponses[422],
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/products/{id}',
  tags,
  security,
  request: {
    params: idParamSchema,
    body: { content: { 'multipart/form-data': { schema: updateProductFormSchema } } },
  },
  responses: {
    200: jsonResponse('Product updated', productResponseSchema),
    401: errorResponses[401],
    404: errorResponses[404],
    409: errorResponses[409],
    422: errorResponses[422],
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/products/{id}',
  tags,
  security,
  request: { params: idParamSchema },
  responses: {
    204: { description: 'Product deleted' },
    401: errorResponses[401],
    404: errorResponses[404],
  },
});

module.exports = router;
