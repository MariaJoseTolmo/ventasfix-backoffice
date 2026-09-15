'use strict';

/**
 * Per-environment Sequelize connection config, consumed by both
 * sequelize-cli (migrations/seeders) and src/models/index.js (runtime).
 *
 * Values come exclusively from env.config.js — never read process.env here.
 * `test` connects to a separate database ("<DB_NAME>_test") so the model
 * test suite never touches development data.
 */

const env = require('./env.config');

const base = {
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'postgres',
  define: {
    underscored: true,
  },
  // Track executed seeders in a DB table (SequelizeData) instead of the
  // default JSON file on disk. Without this, `db:seed:all` re-inserts the
  // same rows (and blows up on the unique constraints) every time the api
  // container restarts and the entrypoint re-runs the seeders.
  seederStorage: 'sequelize',
};

module.exports = {
  development: {
    ...base,
    database: env.DB_NAME,
    logging: console.log,
  },
  test: {
    ...base,
    database: `${env.DB_NAME}_test`,
    logging: false,
  },
  production: {
    ...base,
    database: env.DB_NAME,
    logging: false,
  },
};
