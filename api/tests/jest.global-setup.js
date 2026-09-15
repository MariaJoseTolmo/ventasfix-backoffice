'use strict';

/**
 * Runs once before the whole test suite (see jest.config.js `globalSetup`).
 *
 * Jest sets NODE_ENV=test by default, so env.config/database.config already
 * resolve to the "<DB_NAME>_test" database. This script:
 *   1. Connects to the `postgres` maintenance database and creates the test
 *      database if it does not exist yet (first run, fresh `postgres`
 *      container).
 *   2. Runs the pending migrations against it, so the schema (tables,
 *      partial unique indexes, CHECK constraints) is always current before
 *      any test touches the database.
 *
 * Requires `docker compose up -d postgres` to already be running.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const dotenv = require('dotenv');
const { Client } = require('pg');

// Load .env ourselves, this early, so DB_HOST_PORT below is actually
// populated. env.config.js (required further down) also calls
// dotenv.config() with the same path, but that is a no-op for variables
// already present in process.env — it never overwrites them.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

// Host-side test overrides. `.env` is written for two different runtimes
// (the api container and, here, the bare `npm test` on the host) that
// cannot share every value:
//
// - DB_PORT: `.env` sets it to 5432 (the value the `api` container uses
//   to reach the `postgres` container over the internal Docker network).
//   On a host that also runs its own local PostgreSQL on 5432, connecting
//   there instead of to the Dockerized one fails with a confusing
//   "role ... does not exist" rather than a connection error. `.env`
//   documents exactly this collision via `DB_HOST_PORT` (the port
//   docker-compose publishes to the host); reuse it here when present.
// - UPLOAD_DIR: `.env` points at `/app/uploads`, the path inside the api
//   container's volume, which does not exist on the host running Jest.
//   Product upload tests need a real, writable directory instead. A fresh
//   per-run temp directory is used (and removed in jest.global-teardown.js)
//   so the files multer writes during the suite never pile up inside the
//   project's own `uploads/` folder.
//
// This must run before any test file's own `require('.../env.config')`
// (module registry is fresh per test file, but `process.env` itself is
// shared) — `jest --runInBand` keeps this globalSetup and every test file
// in the same process, so mutating `process.env` here is visible to all
// of them.
if (process.env.DB_HOST_PORT) {
  process.env.DB_PORT = process.env.DB_HOST_PORT;
}

const testUploadDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ventasfix-test-uploads-'));
process.env.UPLOAD_DIR = testUploadDir;

const env = require('../src/config/env.config');
const dbConfig = require('../src/config/database.config').test;

module.exports = async () => {
  const maintenanceClient = new Client({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: 'postgres',
  });

  await maintenanceClient.connect();
  try {
    const { rowCount } = await maintenanceClient.query('SELECT 1 FROM pg_database WHERE datname = $1', [
      dbConfig.database,
    ]);

    if (rowCount === 0) {
      // Database names cannot be parameterized; dbConfig.database is
      // derived from our own env config, not user input.
      await maintenanceClient.query(`CREATE DATABASE "${dbConfig.database}"`);
    }
  } finally {
    await maintenanceClient.end();
  }

  execSync('npx sequelize-cli db:migrate --env test', {
    cwd: __dirname + '/..',
    stdio: 'inherit',
    env: process.env,
  });
};
