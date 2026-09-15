'use strict';

const authService = require('../services/auth.service');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function me(req, res, next) {
  try {
    res.status(200).json(await authService.me(req.user.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
