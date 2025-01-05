/**
 * @file env.js
 * @description Handles loading and validation of environment variables.
 * Dynamically loads `.env.server` and `.env.database` based on `NODE_ENV`.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { getLogger } = require('../utils/logger');
const { logWarn } = require('../utils/logger-helper'); // Lazy import the logger

/**
 * Load a secret value from Docker secrets if available.
 * Fallback to the environment variable.
 *
 * @param {string} secretName - The name of the Docker secret.
 * @param {string} envVarName - The corresponding environment variable name.
 * @returns {string} - The secret value or environment variable value.
 */
const loadSecret = (secretName, envVarName) => {
  const secretPath = `/run/secrets/${secretName}`;
  if (fs.existsSync(secretPath)) {
    return fs.readFileSync(secretPath, 'utf-8').trim();
  }
  return process.env[envVarName] || null;
};

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
    const logger = getLogger(); // Get logger only when necessary
    if (env === 'production') {
      throw new Error(`Invalid NODE_ENV value: ${env}. Allowed values: ${allowedEnvs.join(', ')}`);
    } else {
      logger.error(`Invalid NODE_ENV value: ${env}. Allowed values: ${allowedEnvs.join(', ')}`);
    }
  }
  
  const defaultEnvPath = path.resolve(__dirname, '../../../env/.env.defaults');
  const serverEnvPath = path.resolve(__dirname, `../../../env/${env}/.env.server`);
  const databaseEnvPath = path.resolve(__dirname, `../../../env/${env}/.env.database`);
  
  dotenv.config({ path: defaultEnvPath });
  logMissingFileWarning(defaultEnvPath);
  
  dotenv.config({ path: serverEnvPath });
  logMissingFileWarning(serverEnvPath);
  
  dotenv.config({ path: databaseEnvPath });
  logMissingFileWarning(databaseEnvPath);
  
  if (env === 'production' && (!process.env.ALLOWED_ORIGINS || !process.env.PORT)) {
    logWarn('Critical environment variables are missing in production.');
    throw new Error('Critical environment variables are missing in production.');
  }
  
  return env;
};

/**
 * Logs a warning if the specified file does not exist.
 *
 * @param {string} filePath - The path of the file to check.
 */
const logMissingFileWarning = (filePath) => {
  if (!fs.existsSync(filePath)) {
    logWarn(`Warning: Could not load environment file at ${filePath}`);
  }
};

/**
 * Validates required environment variables or Docker secrets.
 *
 * @param {Array<{ envVar: string, secret: string, required: boolean, defaultValue?: string }>} config
 */
const validateEnv = (config) => {
  const missingVars = config.filter(({ envVar, secret, required, defaultValue }) => {
    const value =
      loadSecret(secret, envVar) ||
      (process.env.NODE_ENV !== 'production' && defaultValue) ||
      null;
    return required && !value;
  });
  
  if (missingVars.length > 0) {
    const logger = getLogger(); // Get logger only when necessary
    const missingNames = missingVars.map(({ envVar, secret }) => secret || envVar).join(', ');
    logger.error(`Missing required environment variables or secrets: ${missingNames}`);
    throw new Error(`Missing required environment variables or secrets: ${missingNames}`);
  }
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

module.exports = { loadEnv, validateEnv, getEnvPrefix };
