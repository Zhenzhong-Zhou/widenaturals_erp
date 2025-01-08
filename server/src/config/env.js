/**
 * @file env.js
 * @description Handles loading and validation of environment variables.
 * Dynamically loads `.env.server` and `.env.database` based on `NODE_ENV`.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { logWarn, logError, logFatal } = require('../utils/logger-helper'); // Lazy import the logger

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
 * @returns {{jwtRefreshSecret: string, jwtAccessSecret: string, env: (string|string), dbPassword: string}} - The current environment (`development`, `test`, `staging`, `production`).
 */
const loadEnv = () => {
  const env = process.env.NODE_ENV?.trim().toLowerCase() || 'development';
  
  // Allowed environments
  const allowedEnvs = ['development', 'test', 'staging', 'production'];
  
  if (!allowedEnvs.includes(env)) {
    const errorMessage = `Invalid NODE_ENV value: ${env}. Allowed values: ${allowedEnvs.join(', ')}`;
    logError(errorMessage);
    throw new Error(errorMessage);
  }
  
  const defaultEnvPath = path.resolve(__dirname, '../../../env/.env.defaults');
  const serverEnvPath = path.resolve(__dirname, `../../../env/${env}/.env.server`);
  const databaseEnvPath = path.resolve(__dirname, `../../../env/${env}/.env.database`);
  
  // Load dotenv files and log missing file warnings
  [defaultEnvPath, serverEnvPath, databaseEnvPath].forEach((filePath) => {
    dotenv.config({ path: filePath });
    if (!fs.existsSync(filePath)) {
      logWarn(`Warning: Could not load environment file at ${filePath}`);
    }
  });
  
  // Load critical secrets
  const jwtAccessSecret = loadSecret('server_jwt_access_secret', 'JWT_ACCESS_SECRET');
  const jwtRefreshSecret = loadSecret('server_jwt_refresh_secret', 'JWT_REFRESH_SECRET');
  const dbPassword = loadSecret('db_password', 'DB_PASSWORD');
  
  // Validate critical secrets in production
  if (env === 'production' && (!jwtAccessSecret || !jwtRefreshSecret || !dbPassword)) {
    const errorMessage = 'Critical secrets are missing in production.';
    logFatal(errorMessage);
    throw new Error(errorMessage);
  }
  
  return { env, jwtAccessSecret, jwtRefreshSecret, dbPassword };
};

/**
 * Validates required environment variables or Docker secrets.
 *
 * @param {Array<{ envVar: string, secret: string, required: boolean, defaultValue?: string }>} config
 */
const validateEnv = (config) => {
  const missingVars = config.filter(
    ({ envVar, secret, required, defaultValue }) => {
      const value =
        loadSecret(secret, envVar) ||
        (process.env.NODE_ENV !== 'production' && defaultValue) ||
        null;
      return required && !value;
    }
  );

  if (missingVars.length > 0) {
    const missingNames = missingVars
      .map(({ envVar, secret }) => secret || envVar)
      .join(', ');
    logError(
      `Missing required environment variables or secrets: ${missingNames}`
    );
    throw new Error(
      `Missing required environment variables or secrets: ${missingNames}`
    );
  }
};

module.exports = { loadEnv, validateEnv, loadSecret };
