/**
 * @file knexfile.js
 * @description Knex.js CLI configuration for database migrations and seeds.
 *
 * Consumed by the `knex` CLI (not by application runtime) to execute schema
 * migrations and seed scripts per environment. Connection and pool settings
 * are sourced from the same modules used by the application runtime so CLI
 * operations and the running server agree on how to reach the database.
 *
 * Environments:
 * - development: Local development.
 * - test:        Automated test runs.
 * - staging:     Pre-production verification.
 * - production:  Production deployments.
 *
 * Environment variables are loaded here explicitly because the knex CLI
 * does not go through the application's normal startup path.
 *
 * @example
 * # Run migrations for the current NODE_ENV
 * npx knex --knexfile knexfile.js migrate:latest
 *
 * # Seed the database
 * npx knex --knexfile knexfile.js seed:run
 *
 * # Override environment explicitly
 * NODE_ENV=staging npx knex --knexfile knexfile.js migrate:latest
 */

'use strict';

const path = require('path');
const { loadEnv } = require('./src/config/env');
const {
  getPoolConfig,
  getConnectionConfig,
} = require('./src/config/db-config');

// Knex CLI bypasses the application bootstrap, so env must be loaded here
// before getConnectionConfig / getPoolConfig read process.env.
loadEnv();

// Migrations live in a single shared directory regardless of environment —
// the same schema migrates forward across dev, test, staging, and production.
const MIGRATIONS_DIR = path.resolve(__dirname, './src/database/migrations');

/**
 * Resolves the seeds directory for a given environment.
 *
 * Seeds are environment-specific (dev fixtures differ from staging/production
 * reference data) so each environment gets its own directory.
 *
 * @param {'development'|'test'|'staging'|'production'} env
 * @returns {string} Absolute path to the environment's seeds directory.
 */
const seedsDirectory = (env) =>
  path.resolve(__dirname, `./src/database/seeds/${env}`);

/**
 * Builds a complete Knex configuration for a single environment.
 *
 * Calls `getConnectionConfig` and `getPoolConfig` per environment (rather
 * than sharing a single object across all four) so that any future
 * environment-specific overrides can be introduced without accidentally
 * mutating shared state.
 *
 * @param {'development'|'test'|'staging'|'production'} env
 * @returns {import('knex').Knex.Config}
 */
const buildEnvConfig = (env) => ({
  client: 'postgresql',
  connection: getConnectionConfig(),
  pool: getPoolConfig(),
  migrations: {
    directory: MIGRATIONS_DIR,
    tableName: 'knex_migrations',
  },
  seeds: {
    directory: seedsDirectory(env),
  },
});

module.exports = {
  development: buildEnvConfig('development'),
  test:        buildEnvConfig('test'),
  staging:     buildEnvConfig('staging'),
  production:  buildEnvConfig('production'),
};
