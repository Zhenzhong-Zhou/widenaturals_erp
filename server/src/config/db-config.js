/**
 * @file db-config.js
 * @description Handles database-specific configuration.
 * Validates required database environment variables and provides connection and pool configurations.
 *
 * Dependencies:
 * - env.js: Used to fetch environment prefixes and validate the `NODE_ENV`.
 *
 * Exports:
 * - `validateEnvVars(env)`: Validates the presence of required database environment variables.
 * - `getPoolConfig()`: Provides the pool configuration for Knex.
 * - `getConnectionConfig(prefix)`: Generates the connection configuration for a given environment prefix.
 *
 * Example Usage:
 * ```
 * const { validateEnvVars, getConnectionConfig } = require('./db-config');
 * validateEnvVars('development');
 * const connection = getConnectionConfig('DEV');
 * ```
 */

const { loadSecret } = require('./env');
const AppError = require('../utils/app-error');

/**
 * Retrieves the database pool configuration.
 */
const getPoolConfig = () => ({
  min: parseInt(process.env.DB_POOL_MIN, 10) || 2,
  max: parseInt(process.env.DB_POOL_MAX, 10) || 10,
});

/**
 * Retrieves the connection configuration.
 */
const getConnectionConfig = () => {
  const dbPassword = loadSecret('db_password', 'DB_PASSWORD');
  if (!dbPassword) {
    throw AppError.validationError(
      'Database password (DB_PASSWORD) is required but was not provided.',
      {
        type: 'ConfigurationError',
        isExpected: true,
      }
    );
  }
  return {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: dbPassword,
    port: process.env.DB_PORT,
  };
};

module.exports = { getPoolConfig, getConnectionConfig };
