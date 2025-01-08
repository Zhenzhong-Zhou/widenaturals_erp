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

const { loadEnv } = require('./env');

// Load environment and secrets
const { dbPassword } = loadEnv();

/**
 * Validates required database environment variables.
 */
const validateEnvVars = () => {
  const requiredVars = [
    'DB_HOST',
    'DB_NAME',
    'DB_USER',
    'DB_PORT',
  ];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  if (!dbPassword) missingVars.push('DB_PASSWORD');
  
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
};

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
const getConnectionConfig = () => ({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: dbPassword,
  port: process.env.DB_PORT,
});

module.exports = { validateEnvVars, getPoolConfig, getConnectionConfig };
