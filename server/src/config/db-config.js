/**
 * @file db-config.js
 * @description Handles database-specific configuration.
 * - Validates required database environment variables.
 * - Provides connection and pool configurations.
 *
 * Dependencies:
 * - env.js: Used to fetch environment prefixes and validate `NODE_ENV`.
 *
 * Exports:
 * - `getPoolConfig()`: Provides the pool configuration for Knex.
 * - `getConnectionConfig()`: Generates the connection configuration.
 */

const { loadSecret } = require('./env');

// Detect if running in production
const isProduction = process.env.NODE_ENV === 'production';

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
  // Only load the password in non-production environments
  const dbPassword = isProduction ? undefined : loadSecret('db_password', 'DB_PASSWORD');
  
  return {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: dbPassword,
    port: process.env.DB_PORT,
    ssl: isProduction ? { rejectUnauthorized: false } : false, // Enable SSL in production if needed
  };
};

module.exports = { getPoolConfig, getConnectionConfig };
