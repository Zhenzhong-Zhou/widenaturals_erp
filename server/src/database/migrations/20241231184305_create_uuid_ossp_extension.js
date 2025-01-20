const { loadEnv } = require('../../config/env');
loadEnv(); // Ensure environment variables are loaded

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.Raw<TResult>}
 */
exports.up = async function (knex) {
  await knex.raw("SET timezone = 'UTC';"); // Set timezone for session
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'); // Enable uuid-ossp extension
  return knex.raw(
    `ALTER DATABASE ${process.env.DB_NAME} SET timezone TO 'UTC';`
  ); // Set database timezone to UTC
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.Raw<TResult>}
 */
exports.down = async function (knex) {
  await knex.raw('DROP EXTENSION IF EXISTS "uuid-ossp";'); // Remove uuid-ossp extension
  return knex.raw(
    `ALTER DATABASE ${process.env.DB_NAME} SET timezone TO DEFAULT;`
  ); // Reset to the server's default timezone
};
