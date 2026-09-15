'use strict';

/**
 * Loads, validates and parses environment variables for the whole api.
 *
 * This is the only module allowed to read `process.env` directly. Every
 * other module (models, migrations, seeders, and later services/config)
 * must import the parsed object exported here instead. That way a missing
 * or malformed variable fails fast, at boot, with a clear message, instead
 * of surfacing as a confusing error three layers down.
 */

const path = require('path');
const dotenv = require('dotenv');

// __dirname is api/src/config; the single .env file lives at the monorepo
// root, shared with docker-compose's `env_file`.
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

const REQUIRED_VARS = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'BCRYPT_ROUNDS',
  'TAX_RATE',
  'SOFTLAND_BASE_URL',
  'SOFTLAND_API_KEY',
  'UPLOAD_DIR',
  'MAX_UPLOAD_SIZE',
  'ALLOWED_MIME_TYPES',
  'CORS_ORIGINS',
  'PORT',
];

function assertAllPresent() {
  const missing = REQUIRED_VARS.filter((name) => {
    const value = process.env[name];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
        'Copy .env.example to .env and fill in every value before starting the api.'
    );
  }
}

function parseCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseNumber(name, value) {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got "${value}".`);
  }
  return parsed;
}

assertAllPresent();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  // PostgreSQL connection
  DB_HOST: process.env.DB_HOST,
  DB_PORT: parseNumber('DB_PORT', process.env.DB_PORT),
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,

  // Auth
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  BCRYPT_ROUNDS: parseNumber('BCRYPT_ROUNDS', process.env.BCRYPT_ROUNDS),

  // Business rules
  TAX_RATE: parseNumber('TAX_RATE', process.env.TAX_RATE),

  // Softland integration
  SOFTLAND_BASE_URL: process.env.SOFTLAND_BASE_URL,
  SOFTLAND_API_KEY: process.env.SOFTLAND_API_KEY,

  // File uploads (ADR-008)
  UPLOAD_DIR: process.env.UPLOAD_DIR,
  MAX_UPLOAD_SIZE: parseNumber('MAX_UPLOAD_SIZE', process.env.MAX_UPLOAD_SIZE),
  ALLOWED_MIME_TYPES: parseCsv(process.env.ALLOWED_MIME_TYPES),

  // HTTP
  CORS_ORIGINS: parseCsv(process.env.CORS_ORIGINS),
  PORT: parseNumber('PORT', process.env.PORT),
};
