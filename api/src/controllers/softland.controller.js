'use strict';

const softlandService = require('../services/softland.service');

async function sync(req, res, next) {
  try {
    res.status(200).json(await softlandService.sync());
  } catch (err) {
    next(err);
  }
}

module.exports = { sync };
