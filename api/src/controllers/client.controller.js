'use strict';

const clientService = require('../services/client.service');

async function list(req, res, next) {
  try {
    res.status(200).json(await clientService.findAll());
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    res.status(200).json(await clientService.findById(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const client = await clientService.create(req.body);
    res.status(201).set('Location', `/api/clients/${client.id}`).json(client);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.status(200).json(await clientService.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await clientService.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
