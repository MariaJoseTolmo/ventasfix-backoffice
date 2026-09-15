'use strict';

const bcrypt = require('bcrypt');

const env = require('../config/env.config');
const { isValidRut } = require('../utils/rut.util');

const EMAIL_DOMAIN = /@ventasfix\.cl$/i;

/**
 * Workers with access to the backoffice.
 *
 * Security-relevant invariants (see docs/adr/ADR-002-sequelize-como-orm.md
 * and docs/adr/ADR-010-errores-de-dominio.md):
 *  - `password` is always stored as a bcrypt hash, never plain text.
 *  - `defaultScope` hides `password` from every query; use the explicit
 *    `withPassword` scope (only from the login path) to read it.
 *
 * Uniqueness for `email` and `rut` is enforced exclusively by the partial
 * unique indexes created in the migration (WHERE deleted_at IS NULL), not
 * by `unique: true` here — a plain unique constraint would not know about
 * soft-deleted rows and would block reusing the email/rut of a deleted
 * user. See docs/adr/ADR-007-borrado-logico.md.
 */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      rut: {
        type: DataTypes.STRING(12),
        allowNull: false,
        validate: {
          isValidRut(value) {
            if (!isValidRut(value)) {
              throw new Error('rut must be a valid Chilean RUT (e.g. 12345678-5)');
            }
          },
        },
      },
      firstName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'first_name',
        validate: {
          notEmpty: { msg: 'first_name must not be empty' },
        },
      },
      lastName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'last_name',
        validate: {
          notEmpty: { msg: 'last_name must not be empty' },
        },
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          isEmail: { msg: 'email must be a valid email address' },
          is: {
            args: [EMAIL_DOMAIN],
            msg: 'email must belong to the @ventasfix.cl domain',
          },
        },
      },
      password: {
        type: DataTypes.STRING(60),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'password must not be empty' },
        },
      },
    },
    {
      tableName: 'users',
      underscored: true,
      timestamps: true,
      paranoid: true,
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: {
          attributes: {},
        },
      },
    }
  );

  async function hashPasswordIfChanged(user) {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, env.BCRYPT_ROUNDS);
    }
  }

  // Instance-level writes (User.create, user.save()) go through here.
  User.addHook('beforeSave', hashPasswordIfChanged);

  // ADR-002: bulk operations (User.update(data, { where }), User.bulkCreate)
  // do NOT trigger instance hooks by default, so a careless bulk update
  // would persist a plain-text password. Forcing individualHooks here makes
  // every bulk write go through the per-instance path above instead.
  User.addHook('beforeBulkCreate', (instances, options) => {
    options.individualHooks = true;
  });
  User.addHook('beforeBulkUpdate', (options) => {
    options.individualHooks = true;
  });

  User.prototype.comparePassword = function comparePassword(plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
  };

  // `defaultScope` only affects SELECTs. `User.create()` and a `save()`
  // that changed `password` hydrate the instance from the write itself, so
  // `toJSON()` on those instances would still carry the hash. Stripping it
  // here makes every serialization safe at the model boundary, regardless
  // of which service or scope produced the instance. `this.password` (the
  // dataValues getter) is untouched, so `comparePassword` keeps working.
  User.prototype.toJSON = function toJSON() {
    const { password, ...publicFields } = this.get({ plain: true });
    return publicFields;
  };

  return User;
};
