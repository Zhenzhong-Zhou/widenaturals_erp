const { loadEnv } = require('../../config/env');
loadEnv();

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = async function (knex) {
  await knex.raw("SET timezone = 'UTC';");
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
  
  const dbName = process.env.DB_NAME;
  if (dbName) {
    await knex.raw(`ALTER DATABASE ?? SET timezone TO 'UTC'`, [dbName]);
  } else {
    console.warn('DB_NAME is not set. Skipping ALTER DATABASE.');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = async function (knex) {
  console.warn('Skipping DROP EXTENSION uuid-ossp (used by UUID columns).');
  
  const dbName = process.env.DB_NAME;
  if (dbName) {
    await knex.raw('ALTER DATABASE ?? SET timezone TO DEFAULT', [dbName]);
  } else {
    console.warn('DB_NAME is not set. Skipping ALTER DATABASE.');
  }
};
