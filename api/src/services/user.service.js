'use strict';

const db = require('../models');
const { NotFoundError, ConflictError } = require('../errors');
const { toCamelCaseKeys, toSnakeCaseKeys } = require('../utils/case.util');

const { User } = db;

function serialize(user) {
  // `defaultScope` strips `password` from every SELECT (findAll/findById),
  // but `create()`/`save()` hydrate the instance straight from the
  // INSERT/UPDATE RETURNING clause, which is not scoped — so the in-memory
  // instance right after a write still carries the hash. Stripping it here
  // too makes every response safe regardless of which path produced it.
  const { password, ...publicFields } = user.toJSON();
  return toSnakeCaseKeys(publicFields);
}

/**
 * Pre-check for a friendlier 409 before hitting the partial unique index
 * (docs/adr/ADR-007). Not sufficient on its own: the index (and the
 * errorHandler's UniqueConstraintError -> ConflictError translation) is
 * the real backstop against the race condition between this check and
 * the INSERT/UPDATE.
 */
async function assertUniqueFields({ email, rut }, excludeId = null) {
  if (email) {
    const existing = await User.findOne({ where: { email } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictError('A user with that email already exists');
    }
  }

  if (rut) {
    const existing = await User.findOne({ where: { rut } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictError('A user with that rut already exists');
    }
  }
}

async function findAll() {
  const users = await User.findAll({ order: [['id', 'ASC']] });
  return users.map(serialize);
}

async function findById(id) {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User not found');
  return serialize(user);
}

async function create(data) {
  const attrs = toCamelCaseKeys(data);
  await assertUniqueFields(attrs);

  const user = await User.create(attrs);
  return serialize(user);
}

async function update(id, data) {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User not found');

  const attrs = toCamelCaseKeys(data);
  await assertUniqueFields(attrs, user.id);

  // docs/adr/ADR-002 "Advertencia crítica": findByPk + set + save, never a
  // bulk write with a where clause, so the beforeSave hook (password
  // hashing) always runs.
  user.set(attrs);
  await user.save();
  return serialize(user);
}

async function remove(id) {
  const user = await User.findByPk(id);
  if (!user) throw new NotFoundError('User not found');
  await user.destroy();
}

module.exports = { findAll, findById, create, update, remove };
