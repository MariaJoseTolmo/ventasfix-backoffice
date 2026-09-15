'use strict';

const userService = require('../services/user.service');

async function list(req, res, next) {
  try {
    res.status(200).json(await userService.findAll());
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    res.status(200).json(await userService.findById(req.params.id));
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const user = await userService.create(req.body);
    res.status(201).set('Location', `/api/users/${user.id}`).json(user);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    res.status(200).json(await userService.update(req.params.id, req.body));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await userService.remove(req.params.id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
