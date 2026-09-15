'use strict';

/**
 * Standard sequelize-cli bootstrap, trimmed down: instantiates Sequelize
 * from database.config.js (which itself reads env.config.js), then
 * auto-loads every `*.model.js` file in this directory.
 */

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');

const env = require('../config/env.config');
const config = require('../config/database.config')[env.NODE_ENV];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {};

fs.readdirSync(__dirname)
  .filter((file) => file.endsWith('.model.js'))
  .forEach((file) => {
    const defineModel = require(path.join(__dirname, file));
    const model = defineModel(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.values(db).forEach((model) => {
  if (typeof model.associate === 'function') {
    model.associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
