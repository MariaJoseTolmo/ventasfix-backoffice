'use strict';

/**
 * HTTP entrypoint. The app itself (routes, middlewares, Swagger) lives in
 * src/app.js so it can be imported directly by supertest without binding
 * a port. This file's only job is verifying the database connection and
 * starting the listener.
 */

const app = require('./src/app');
const env = require('./src/config/env.config');
const db = require('./src/models');

async function start() {
  await db.sequelize.authenticate();

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`api listening on port ${env.PORT} (${env.NODE_ENV})`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start the api:', err);
  process.exit(1);
});
