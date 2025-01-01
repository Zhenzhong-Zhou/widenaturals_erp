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
 * npx knex --knexfile knexfile.js migrate:latest
 * ```
 */

const path = require('path');
const { loadEnv, getEnvPrefix } = require('./src/config/env');
const { validateEnvVars, getPoolConfig, getConnectionConfig } = require('./src/config/db-config');

// Load environment and validate variables
const env = loadEnv();
validateEnvVars(env);

// Debug logging
if (env !== 'production') {
  const envPrefix = getEnvPrefix(env);
  console.log(`Environment: ${env}`);
  console.log(`Database Host: ${process.env[`${envPrefix}_DB_HOST`]}`);
  console.log(`Database Name: ${process.env[`${envPrefix}_DB_NAME`]}`);
  console.log(`Database User: ${process.env[`${envPrefix}_DB_USER`]}`);
  console.log(`Pool Min: ${getPoolConfig().min}, Max: ${getPoolConfig().max}`);
}

// Base Knex configuration
const baseConfig = {
  client: 'postgresql',
  pool: getPoolConfig(),
  migrations: {
    directory: path.resolve(__dirname, './src/database/migrations'),
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: path.resolve(__dirname, './src/database/seeds'),
  },
};

// Export Knex configurations
module.exports = {
  development: { ...baseConfig, connection: getConnectionConfig('DEV') },
  test: { ...baseConfig, connection: getConnectionConfig('TEST') },
  staging: { ...baseConfig, connection: getConnectionConfig('STAGING') },
  production: { ...baseConfig, connection: getConnectionConfig('PROD') },
};
