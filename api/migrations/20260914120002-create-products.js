'use strict';

/**
 * products table. See docs/03-MODELO-DATOS.md, docs/adr/ADR-007-borrado-logico.md
 * and docs/adr/ADR-009-precio-venta-derivado.md.
 *
 * CHECK constraints are the backstop that holds even for a raw SQL INSERT
 * that bypasses the Sequelize hooks/validators entirely.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      sku: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(150),
        allowNull: false,
      },
      short_description: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      long_description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      image_url: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      net_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      sale_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false,
      },
      current_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      minimum_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      low_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      high_stock: {
        type: Sequelize.INTEGER,
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
      CREATE UNIQUE INDEX products_sku_active_idx
        ON products (sku) WHERE deleted_at IS NULL;
    `);

    await queryInterface.sequelize.query(`
      CREATE INDEX products_deleted_at_idx ON products (deleted_at);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
        ADD CONSTRAINT products_net_price_check CHECK (net_price >= 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
        ADD CONSTRAINT products_sale_price_check CHECK (sale_price >= 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
        ADD CONSTRAINT products_current_stock_check CHECK (current_stock >= 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
        ADD CONSTRAINT products_minimum_stock_check CHECK (minimum_stock >= 0);
    `);

    await queryInterface.sequelize.query(`
      ALTER TABLE products
        ADD CONSTRAINT products_stock_thresholds_check
        CHECK (minimum_stock <= low_stock AND low_stock <= high_stock);
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      'ALTER TABLE products DROP CONSTRAINT IF EXISTS products_stock_thresholds_check;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE products DROP CONSTRAINT IF EXISTS products_minimum_stock_check;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE products DROP CONSTRAINT IF EXISTS products_current_stock_check;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE products DROP CONSTRAINT IF EXISTS products_sale_price_check;'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE products DROP CONSTRAINT IF EXISTS products_net_price_check;'
    );
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_deleted_at_idx;');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS products_sku_active_idx;');
    await queryInterface.dropTable('products');
  },
};
