/**
 * @file db-config.js
 * @description Centralized database configuration module.
 *
 * Responsibilities:
 * - Normalizes environment variables into correct runtime types (string → number, etc.)
 * - Validates required database configuration values
 * - Resolves sensitive credentials via secret manager with environment fallback
 * - Provides standardized configuration for PostgreSQL connection and pooling
 *
 * Design considerations:
 * - Avoids direct use of `process.env` in application layers
 * - Ensures type safety before passing values to `pg` client
 * - Supports environment-aware behavior (e.g., SSL in production)
 *
 * @note
 * This module should be the single source of truth for database configuration.
 * Do not access `process.env` directly in repository or service layers.
 *
 * Exports:
 * - `getConnectionConfig()`:
 *    Returns a normalized PostgreSQL connection configuration (`pg.PoolConfig`)
 *
 * - `getPoolConfig()`:
 *    Returns connection pool settings (min/max connections)
 */

const { loadSecret, loadEnv } = require('./env');
const AppError = require('../utils/AppError');

loadEnv();

// Detect if running in production
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Safely parses a numeric environment variable.
 *
 * @param {string} key - Environment variable key
 * @param {number} defaultValue - Fallback value if not provided
 * @returns {number} Parsed numeric value
 * @throws {Error} If value is not a valid number
 */
const getEnvNumber = (key, defaultValue) => {
  const value = process.env[key];
  
  if (value === undefined || value === '') {
    return defaultValue;
  }
  
  const parsed = Number(value);
  
  if (Number.isNaN(parsed)) {
    throw AppError.initializationError(
      `Invalid number for environment variable: ${key}`,
      {
        context: 'config/db/getEnvNumber',
        meta: { key, value },
      }
    );
  }
  
  return parsed;
};

/**
 * Safely retrieves a string environment variable.
 *
 * @param {string} key - Environment variable key
 * @param {string} [fallback] - Optional fallback value
 * @param {Object} [options]
 * @param {boolean} [options.required=false] - Whether this variable is required
 * @returns {string}
 * @throws {Error} If required and missing
 */
const getEnvString = (key, fallback, options = {}) => {
  const value = process.env[key] ?? fallback;
  
  if (options.required && !value) {
    throw AppError.initializationError(
      `Missing required environment variable: ${key}`,
      {
        context: 'config/db/getEnvString',
        meta: { key },
      }
    );
  }
  
  return value;
};

/**
 * Retrieves PostgreSQL pool configuration.
 *
 * Responsibilities:
 * - Controls connection pool size
 * - Prevents resource exhaustion
 * - Allows environment-based tuning
 *
 * @returns {{ min: number, max: number }}
 */
const getPoolConfig = () => ({
  min: getEnvNumber('DB_POOL_MIN', 2),
  max: getEnvNumber('DB_POOL_MAX', 10),
});

/**
 * Retrieves PostgreSQL connection configuration.
 *
 * Responsibilities:
 * - Normalizes environment variables into correct types
 * - Resolves credentials via secret manager (production-safe)
 * - Applies environment-specific SSL configuration
 *
 * Design:
 * - Production: secrets manager preferred
 * - Development: fallback to env variables
 * - Ensures type safety before passing to `pg.Pool`
 *
 * @returns {import('pg').PoolConfig}
 */
const getConnectionConfig = () => {
  // Always prefer secret manager, fallback to env
  const dbPassword =
    loadSecret('db_password', 'DB_PASSWORD') ||
    process.env.DB_PASSWORD ||
    '';
  
  return {
    host: getEnvString('DB_HOST', 'localhost', { required: true }),
    database: getEnvString('DB_NAME', 'postgres', { required: true }),
    user: getEnvString('DB_USER', 'postgres', { required: true }),
    password: dbPassword,
    port: getEnvNumber('DB_PORT', 5432),
    ssl: isProduction
      ? { rejectUnauthorized: false }
      : false,
  };
};

module.exports = {
  getPoolConfig,
  getEnvNumber,
  getEnvString,
  getConnectionConfig
};
