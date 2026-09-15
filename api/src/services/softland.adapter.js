'use strict';

const axios = require('axios');

const env = require('../config/env.config');
const { ExternalServiceError } = require('../errors');

// Anti-corruption layer: Softland's format never leaks past this file.
// See docs/adr/ADR-006-mock-softland-con-adapter.md.
const softlandClient = axios.create({
  baseURL: env.SOFTLAND_BASE_URL,
  timeout: 5000,
  headers: { 'x-api-key': env.SOFTLAND_API_KEY },
});

function toDomainProduct(softlandProduct) {
  return {
    sku: softlandProduct.codigo,
    name: softlandProduct.descripcion,
    net_price: softlandProduct.precioNeto,
    current_stock: softlandProduct.existencia,
  };
}

function toSoftlandProduct(domainProduct) {
  return {
    codigo: domainProduct.sku,
    descripcion: domainProduct.name,
    precioNeto: domainProduct.net_price,
    existencia: domainProduct.current_stock,
  };
}

async function fetchProducts() {
  try {
    const { data } = await softlandClient.get('/api/products');
    return data.map(toDomainProduct);
  } catch (err) {
    throw new ExternalServiceError('Softland did not respond to the product catalog request');
  }
}

async function pushProducts(products) {
  try {
    const payload = products.map(toSoftlandProduct);
    const { data } = await softlandClient.post('/api/products/sync', payload);
    return data;
  } catch (err) {
    throw new ExternalServiceError('Softland did not accept the product sync request');
  }
}

module.exports = { fetchProducts, pushProducts };
