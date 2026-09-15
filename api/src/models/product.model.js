'use strict';

const env = require('../config/env.config');

/**
 * Catalog products. `sale_price` is a real, stored column, but it is never
 * written by the client: a `beforeSave` hook always recalculates it from
 * `net_price` and `TAX_RATE`. See docs/adr/ADR-009-precio-venta-derivado.md.
 *
 * Sequelize returns DECIMAL columns as strings (to avoid silent precision
 * loss), so every arithmetic operation below goes through `parseFloat`
 * first and stores the result back with `toFixed(2)`.
 *
 * Uniqueness for `sku` is enforced by the partial unique index in the
 * migration (WHERE deleted_at IS NULL), not by `unique: true` here — see
 * the same note in user.model.js / docs/adr/ADR-007-borrado-logico.md.
 */
module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define(
    'Product',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      sku: {
        type: DataTypes.STRING(50),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'sku must not be empty' },
        },
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'name must not be empty' },
        },
      },
      shortDescription: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'short_description must not be empty' },
        },
      },
      longDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notEmpty: { msg: 'long_description must not be empty' },
        },
      },
      imageUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'image_url must not be empty' },
        },
      },
      netPrice: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        validate: {
          min: { args: [0], msg: 'net_price must be greater than or equal to 0' },
        },
      },
      // Derived column. Always overwritten by the beforeSave hook below;
      // any value sent by the client is ignored.
      //
      // Deliberately NOT `allowNull: false` here: Sequelize runs field
      // validation (including the notNull check that `allowNull: false`
      // implies) BEFORE `beforeCreate`/`beforeSave` hooks fire, so at that
      // point sale_price is still unset and a JS-level required check
      // would reject every create(). The real guarantee is the NOT NULL +
      // CHECK (sale_price >= 0) constraint in the migration, enforced by
      // PostgreSQL after the hook has already computed the value.
      salePrice: {
        type: DataTypes.DECIMAL(12, 2),
      },
      currentStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: { args: [0], msg: 'current_stock must be greater than or equal to 0' },
        },
      },
      minimumStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: { args: [0], msg: 'minimum_stock must be greater than or equal to 0' },
        },
      },
      lowStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      highStock: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'products',
      underscored: true,
      timestamps: true,
      paranoid: true,
      validate: {
        // Defense in depth: the authoritative constraint is the CHECK in
        // the migration, which also catches raw SQL writes. This gives a
        // friendlier message to anything going through the ORM.
        stockThresholdsOrdered() {
          if (
            this.minimumStock != null &&
            this.lowStock != null &&
            this.highStock != null &&
            !(this.minimumStock <= this.lowStock && this.lowStock <= this.highStock)
          ) {
            throw new Error('minimum_stock must be <= low_stock, and low_stock must be <= high_stock');
          }
        },
      },
    }
  );

  function recalcSalePrice(product) {
    const netPrice = parseFloat(product.netPrice);
    const salePrice = netPrice * (1 + env.TAX_RATE);
    product.salePrice = salePrice.toFixed(2);
  }

  // Instance-level writes (Product.create, product.save()) go through here.
  Product.addHook('beforeSave', recalcSalePrice);

  // ADR-002 / ADR-009: bulk operations skip instance hooks by default,
  // which would leave sale_price out of sync with net_price. Forcing
  // individualHooks routes every bulk write through the per-instance path.
  Product.addHook('beforeBulkCreate', (instances, options) => {
    options.individualHooks = true;
  });
  Product.addHook('beforeBulkUpdate', (options) => {
    options.individualHooks = true;
  });

  return Product;
};
