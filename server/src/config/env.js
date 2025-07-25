/**
 * @file env.js
 * @description Handles loading and validation of environment variables.
 * Dynamically loads `.env.server` and `.env.database` based on `NODE_ENV`.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const { logSystemError } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

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
 * @returns {{env: (string|string)}} - The current environment (`development`, `test`, `staging`, `production`).
 */
const loadEnv = () => {
  const env = process.env.NODE_ENV?.trim().toLowerCase() || 'development';

  // Allowed environments
  const allowedEnvs = ['development', 'test', 'staging', 'production'];
  if (!allowedEnvs.includes(env)) {
    throw AppError.validationError(
      `Invalid NODE_ENV: ${env}. Allowed values: ${allowedEnvs.join(', ')}`
    );
  }

  // Load dotenv files based on environment
  const envPaths = [
    path.resolve(__dirname, '../../../env/.env.defaults'),
    path.resolve(__dirname, `../../../env/${env}/.env.server`),
    path.resolve(__dirname, `../../../env/${env}/.env.database`),
  ];

  envPaths.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath });
    } else {
      logSystemError('Environment file not found', {
        filePath,
        severity: 'warning',
        context: 'env-loader',
      });
    }
  });

  return { env };
};

/**
 * Validates required environment variables or Docker secrets.
 * @param {Object} groups - The environment groups to validate.
 */
const validateEnv = (groups) => {
  const missingVars = [];

  for (const vars of Object.values(groups)) {
    vars.forEach(({ envVar, secret, required, defaultValue }) => {
      const value = secret ? secret() : process.env[envVar] || defaultValue;

      if (required && !value) {
        missingVars.push(envVar);
      }

      if (!process.env[envVar] && defaultValue) {
        process.env[envVar] = defaultValue;
        logSystemError('Missing required environment variables or secrets', {
          missingVars,
          context: 'env-loader',
          severity: 'critical',
        });
      }
    });
  }

  if (missingVars.length > 0) {
    const errorMsg = `Missing required environment variables or secrets: ${missingVars.join(', ')}`;

    logSystemError('Missing required environment variables or secrets', {
      missingVars,
      context: 'env-loader',
      severity: 'critical',
    });

    throw AppError.validationError(errorMsg);
  }
};

module.exports = { loadEnv, validateEnv, loadSecret };
