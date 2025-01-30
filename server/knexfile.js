/**
 * @file knexfile.js
 * @description Configures Knex.js for managing database migrations and seeds.
 * Combines base configurations with environment-specific connection details.
 *
 * Dependencies:
 * - env.js: Loads and validates the current environment.
 * - db-config.js: Provides connection and pool configurations for the database.
 *
 * Environments:
 * - development: Local development environment.
 * - test: Testing environment.
 * - staging: Pre-production staging environment.
 * - production: Production environment.
 *
 * Example Usage:
 * ```
 * # Run migrations for the current environment
 * npx knex --knexfile knexfile.js migrate:latest
 *
 * # Seed the database for the current environment
 * npx knex --knexfile knexfile.js seed:run
 *
 * # Specify an environment explicitly
 * NODE_ENV=staging npx knex --knexfile knexfile.js migrate:latest
 * ```
 */

const path = require('path');
const { getPoolConfig, getConnectionConfig } = require('./src/config/db-config');

const seedsDirectory = (env) => path.resolve(__dirname, `./src/database/seeds/${env}`);

// Base Knex configuration
const baseConfig = {
  client: 'postgresql',
  pool: getPoolConfig(),
  migrations: {
    directory: path.resolve(__dirname, './src/database/migrations'),
    tableName: 'knex_migrations',
  },
};

// Export Knex configurations
module.exports = {
  development: {
    ...baseConfig,
    connection: getConnectionConfig(),
    seeds: { directory: seedsDirectory('development') },
  },
  test: {
    ...baseConfig,
    connection: getConnectionConfig(),
    seeds: { directory: seedsDirectory('test') },
  },
  staging: {
    ...baseConfig,
    connection: getConnectionConfig(),
    seeds: { directory: seedsDirectory('staging') },
  },
  production: {
    ...baseConfig,
    connection: getConnectionConfig(),
    seeds: { directory: seedsDirectory('production') },
  },
};
