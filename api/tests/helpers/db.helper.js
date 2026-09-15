'use strict';

const db = require('../../src/models');

/** Same truncation strategy as tests/models/*.test.js, reused for HTTP tests. */
async function truncateAll() {
  await db.User.destroy({ truncate: true, cascade: true, force: true });
  await db.Product.destroy({ truncate: true, cascade: true, force: true });
  await db.Client.destroy({ truncate: true, cascade: true, force: true });
}

module.exports = { truncateAll };
