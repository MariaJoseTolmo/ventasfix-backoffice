'use strict';

const bcrypt = require('bcrypt');
const env = require('../src/config/env.config');

/**
 * Initial admin user so the evaluator can log in without registering first.
 *
 * IMPORTANT: sequelize-cli seeders write with `queryInterface.bulkInsert`,
 * which talks to the database directly and does NOT go through the model,
 * so the user.model.js `beforeSave` hook never runs here. The password
 * must be hashed explicitly, with the same bcrypt + BCRYPT_ROUNDS the model
 * hook would have used, or it would land in the table as plain text.
 */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Admin.2026', env.BCRYPT_ROUNDS);
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        rut: '12345678-5',
        first_name: 'System',
        last_name: 'Administrator',
        email: 'admin@ventasfix.cl',
        password: passwordHash,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { email: 'admin@ventasfix.cl' });
  },
};
