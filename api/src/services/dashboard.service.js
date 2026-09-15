'use strict';

const db = require('../models');

const { User, Product, Client } = db;

/**
 * One aggregate endpoint instead of three round trips
 * (docs/04-CONTRATO-API.md). `count()` already excludes soft-deleted rows
 * because `paranoid: true` applies its filter to every query, counts
 * included (docs/adr/ADR-007).
 */
async function summary() {
  const [users, products, clients] = await Promise.all([User.count(), Product.count(), Client.count()]);
  return { users, products, clients };
}

module.exports = { summary };
