'use strict';

const dashboardService = require('../services/dashboard.service');

async function summary(req, res, next) {
  try {
    res.status(200).json(await dashboardService.summary());
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };
