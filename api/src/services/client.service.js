'use strict';

const db = require('../models');
const { NotFoundError, ConflictError } = require('../errors');
const { toCamelCaseKeys, toSnakeCaseKeys } = require('../utils/case.util');

const { Client } = db;

function serialize(client) {
  return toSnakeCaseKeys(client.toJSON());
}

async function assertCompanyRutAvailable(companyRut, excludeId = null) {
  if (!companyRut) return;
  const existing = await Client.findOne({ where: { companyRut } });
  if (existing && existing.id !== excludeId) {
    throw new ConflictError('A client with that company_rut already exists');
  }
}

async function findAll() {
  const clients = await Client.findAll({ order: [['id', 'ASC']] });
  return clients.map(serialize);
}

async function findById(id) {
  const client = await Client.findByPk(id);
  if (!client) throw new NotFoundError('Client not found');
  return serialize(client);
}

async function create(data) {
  const attrs = toCamelCaseKeys(data);
  await assertCompanyRutAvailable(attrs.companyRut);

  const client = await Client.create(attrs);
  return serialize(client);
}

async function update(id, data) {
  const client = await Client.findByPk(id);
  if (!client) throw new NotFoundError('Client not found');

  const attrs = toCamelCaseKeys(data);
  await assertCompanyRutAvailable(attrs.companyRut, client.id);

  // docs/adr/ADR-002 "Advertencia crítica": findByPk + set + save, never a
  // bulk write with a where clause.
  client.set(attrs);
  await client.save();
  return serialize(client);
}

async function remove(id) {
  const client = await Client.findByPk(id);
  if (!client) throw new NotFoundError('Client not found');
  await client.destroy();
}

module.exports = { findAll, findById, create, update, remove };
