/**
 * @file env.js
 * @description Handles loading and validation of environment variables.
 * Dynamically loads `.env.server` and `.env.database` based on `NODE_ENV`.
 */

const path = require('path');
const dotenv = require('dotenv');

/**
 * Loads environment variables from `.env` files based on the `NODE_ENV` value.
 * Validates that the `NODE_ENV` is one of the allowed environments.
 *
 * @returns {string} - The current environment (`development`, `test`, `staging`, `production`).
 */
const loadEnv = () => {
  // Determine the current environment (default to 'development')
  const env = process.env.NODE_ENV?.trim().toLowerCase() || 'development';
  
  // Allowed environments
  const allowedEnvs = ['development', 'test', 'staging', 'production'];
  
  // Validate `NODE_ENV`
  if (!allowedEnvs.includes(env)) {
    throw new Error(
      `Invalid NODE_ENV value: ${env}. Allowed values: ${allowedEnvs.join(', ')}`
    );
  }
  
  // Paths to `.env` files
  const serverEnvPath = path.resolve(__dirname, `../../../env/${env}/.env.server`);
  const databaseEnvPath = path.resolve(__dirname, `../../../env/${env}/.env.database`);
  
  // Load `.env` files
  const serverEnvLoaded = dotenv.config({ path: serverEnvPath });
  const databaseEnvLoaded = dotenv.config({ path: databaseEnvPath });
  
  // Check if `.env` files were loaded successfully
  if (serverEnvLoaded.error) {
    console.warn(`Warning: Could not load ${serverEnvPath}`);
  }
  if (databaseEnvLoaded.error) {
    console.warn(`Warning: Could not load ${databaseEnvPath}`);
  }
  
  return env; // Return the current environment
};

/**
 * Maps the environment to a prefix for convenience (e.g., 'development' -> 'DEV').
 *
 * @param {string} env - The current environment.
 * @returns {string} - The prefix corresponding to the environment.
 */
const getEnvPrefix = (env) => {
  const envMapping = {
    development: 'DEV',
    test: 'TEST',
    staging: 'STAGING',
    production: 'PROD',
  };
  return envMapping[env] || 'UNKNOWN';
};

module.exports = { loadEnv, getEnvPrefix };
