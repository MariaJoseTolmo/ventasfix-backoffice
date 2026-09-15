'use strict';

const { isValidRut } = require('../utils/rut.util');

/**
 * VentasFix's business clients. No relations to the other two entities —
 * the requirements do not call for orders or a shopping cart.
 *
 * Uniqueness for `company_rut` is enforced by the partial unique index in
 * the migration (WHERE deleted_at IS NULL), not by `unique: true` here —
 * see the same note in user.model.js / docs/adr/ADR-007-borrado-logico.md.
 */
module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define(
    'Client',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      companyRut: {
        type: DataTypes.STRING(12),
        allowNull: false,
        validate: {
          isValidRut(value) {
            if (!isValidRut(value)) {
              throw new Error('company_rut must be a valid Chilean RUT (e.g. 76123456-0)');
            }
          },
        },
      },
      industry: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'industry must not be empty' },
        },
      },
      legalName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'legal_name must not be empty' },
        },
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'phone must not be empty' },
        },
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'address must not be empty' },
        },
      },
      contactName: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'contact_name must not be empty' },
        },
      },
      // No domain restriction here, unlike users.email: contacts are
      // external to VentasFix.
      contactEmail: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          isEmail: { msg: 'contact_email must be a valid email address' },
        },
      },
    },
    {
      tableName: 'clients',
      underscored: true,
      timestamps: true,
      paranoid: true,
    }
  );

  return Client;
};
