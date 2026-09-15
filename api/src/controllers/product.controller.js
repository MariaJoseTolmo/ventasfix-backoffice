'use strict';

const productService = require('../services/product.service');

/** Translates HTTP (body + uploaded file) into the plain domain payload the service expects. */
function buildPayload(req) {
  const payload = { ...req.body };
  if (req.file) {
    payload.image_url = req.file.filename;
  }
  return payload;
}

async function list(req, res, next) {
  try {
    res.status(200).json(await productService.findAll());
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    res.status(200).json(await productService.findById(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const product = await productService.create(buildPayload(req));
    res.status(201).set('Location', `/api/products/${product.id}`).json(product);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.status(200).json(await productService.update(req.params.id, buildPayload(req)));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await productService.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
