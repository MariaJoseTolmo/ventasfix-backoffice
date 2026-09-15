'use strict';

const fs = require('fs/promises');
const path = require('path');

const db = require('../models');
const env = require('../config/env.config');
const { NotFoundError, ConflictError } = require('../errors');
const { toCamelCaseKeys, toSnakeCaseKeys } = require('../utils/case.util');

const { Product } = db;

function serialize(product) {
  return toSnakeCaseKeys(product.toJSON());
}

async function assertSkuAvailable(sku, excludeId = null) {
  if (!sku) return;
  const existing = await Product.findOne({ where: { sku } });
  if (existing && existing.id !== excludeId) {
    throw new ConflictError('A product with that sku already exists');
  }
}

/** Ignores ENOENT: the file may already be gone, which is not an error here. */
async function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  try {
    await fs.unlink(path.join(env.UPLOAD_DIR, imageUrl));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

async function findAll() {
  const products = await Product.findAll({ order: [['id', 'ASC']] });
  return products.map(serialize);
}

async function findById(id) {
  const product = await Product.findByPk(id);
  if (!product) throw new NotFoundError('Product not found');
  return serialize(product);
}

async function create(data) {
  const attrs = toCamelCaseKeys(data);
  await assertSkuAvailable(attrs.sku);

  const product = await Product.create(attrs);
  return serialize(product);
}

async function update(id, data) {
  const product = await Product.findByPk(id);
  if (!product) throw new NotFoundError('Product not found');

  const attrs = toCamelCaseKeys(data);
  await assertSkuAvailable(attrs.sku, product.id);

  const previousImageUrl = product.imageUrl;

  // docs/adr/ADR-002 "Advertencia crítica": findByPk + set + save, never a
  // bulk write with a where clause, so the beforeSave hook (sale_price
  // recalculation) still runs.
  product.set(attrs);
  await product.save();

  // After save() the instance still holds the raw values that were set()
  // (e.g. netPrice as the JS number 2000), while create()/findByPk return
  // DECIMAL columns as strings ("2000.00"). Reloading makes the update
  // response identical in shape to every other product response.
  await product.reload();

  // docs/adr/ADR-008: replacing the image must not leave the old file
  // behind as an orphan.
  if (attrs.imageUrl && attrs.imageUrl !== previousImageUrl) {
    await deleteImageFile(previousImageUrl);
  }

  return serialize(product);
}

async function remove(id) {
  const product = await Product.findByPk(id);
  if (!product) throw new NotFoundError('Product not found');
  // The image file is intentionally kept on disk: the delete is logical
  // (docs/adr/ADR-007), so a future restore() must still be able to serve
  // the same image.
  await product.destroy();
}

module.exports = { findAll, findById, create, update, remove };
