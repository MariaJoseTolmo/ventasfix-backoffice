'use strict';

/**
 * clients table. See docs/03-MODELO-DATOS.md and docs/adr/ADR-007-borrado-logico.md.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      company_rut: {
        type: Sequelize.STRING(12),
        allowNull: false,
      },
      industry: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      legal_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },
      address: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      contact_name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      contact_email: {
        type: Sequelize.STRING(150),
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
      CREATE UNIQUE INDEX clients_company_rut_active_idx
        ON clients (company_rut) WHERE deleted_at IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX clients_deleted_at_idx ON clients (deleted_at);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS clients_deleted_at_idx;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS clients_company_rut_active_idx;');
    await queryInterface.dropTable('clients');
  },
};
