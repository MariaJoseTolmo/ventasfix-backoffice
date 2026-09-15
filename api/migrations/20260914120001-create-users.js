'use strict';

/**
 * users table. See docs/03-MODELO-DATOS.md and docs/adr/ADR-007-borrado-logico.md.
 *
 * Uniqueness on `email` and `rut` is enforced with PARTIAL unique indexes
 * (WHERE deleted_at IS NULL) instead of a plain UNIQUE constraint, so a
 * soft-deleted row's email/rut can be reused by a new row. A plain UNIQUE
 * would keep blocking it forever and the resulting constraint violation
 * would surface as an uncontrolled 500 instead of a domain 409.
 *
 * Partial indexes and CHECK constraints are created with raw SQL: the
 * Sequelize QueryInterface helpers for `where` on addIndex/addConstraint
 * are inconsistent across versions, and raw SQL is the only way to be
 * certain the generated index reads `WHERE (deleted_at IS NULL)`.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      rut: {
        type: Sequelize.STRING(12),
        allowNull: false,
      },
      first_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      password: {
        type: Sequelize.STRING(60),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX users_email_active_idx
        ON users (email) WHERE deleted_at IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE UNIQUE INDEX users_rut_active_idx
        ON users (rut) WHERE deleted_at IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX users_deleted_at_idx ON users (deleted_at);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_deleted_at_idx;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_rut_active_idx;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS users_email_active_idx;');
    await queryInterface.dropTable('users');
  },
};
