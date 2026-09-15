'use strict';

const productService = require('./product.service');
const softlandAdapter = require('./softland.adapter');

/** Pushes the local catalog to Softland through the adapter. */
async function sync() {
  const localProducts = await productService.findAll();
  const result = await softlandAdapter.pushProducts(localProducts);

  return {
    sent: localProducts.length,
    received: result.received,
    status: result.status,
  };
}

module.exports = { sync };
