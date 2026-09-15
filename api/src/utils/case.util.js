'use strict';

/**
 * Shallow snake_case <-> camelCase key conversion.
 *
 * The API contract (docs/03-MODELO-DATOS.md) speaks snake_case
 * (`net_price`, `first_name`, ...); Sequelize model attributes are
 * camelCase (`netPrice`, `firstName`, ...) because `underscored: true`
 * already handles the camelCase <-> snake_case column mapping on its own
 * side. Services are the seam between those two worlds, so the
 * conversion lives here and is applied only inside services.
 *
 * Only shallow (one level) conversion is needed: none of the three
 * entities has nested objects in its request or response body.
 */

function snakeToCamelKey(key) {
  return key.replace(/_([a-z0-9])/g, (_match, char) => char.toUpperCase());
}

function camelToSnakeKey(key) {
  return key.replace(/[A-Z]/g, (char) => `_${char.toLowerCase()}`);
}

function mapKeys(obj, transform) {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return obj;
  }

  return Object.fromEntries(Object.entries(obj).map(([key, value]) => [transform(key), value]));
}

function toCamelCaseKeys(obj) {
  return mapKeys(obj, snakeToCamelKey);
}

function toSnakeCaseKeys(obj) {
  return mapKeys(obj, camelToSnakeKey);
}

module.exports = { toCamelCaseKeys, toSnakeCaseKeys };
