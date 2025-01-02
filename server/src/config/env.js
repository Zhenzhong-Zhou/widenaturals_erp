/**
 * @file env.js
 * @description Handles the loading of environment variables for the application.
 * Dynamically loads `.env.server` and `.env.database` based on the `NODE_ENV` value.
 * Validates the `NODE_ENV` and ensures that required environment variables are available.
 *
 * Dependencies:
 * - dotenv: Used to load environment variables from `.env` files.
 * - path: Provides utilities for working with file and directory paths.
 *
 * Exports:
 * - `env`: The current environment (`development`, `test`, `staging`, `production`).
 *
 * Example Usage:
 * ```
 * const { env } = require('./env');
 * console.log(env); // 'development'
 * ```
 */

const path = require('path');
const dotenv = require('dotenv');

// Load NODE_ENV and default to 'development'
const loadEnv = () => {
  // Load NODE_ENV and default to 'development' if undefined
  const env = process.env.NODE_ENV?.trim().toLowerCase() || 'development';

  // Load environment-specific variables
  dotenv.config({
    path: path.resolve(__dirname, `../../../env/${env}/.env.server`),
  });
  dotenv.config({
    path: path.resolve(__dirname, `../../../env/${env}/.env.database`),
  });

  // Validate that NODE_ENV is one of the allowed environments
  const allowedEnvs = ['development', 'test', 'staging', 'production'];
  if (!allowedEnvs.includes(env)) {
    throw new Error(
      `Invalid NODE_ENV value: ${env}. Allowed values: ${allowedEnvs.join(', ')}`
    );
  }

  return env;
};

// Map environment to prefixes (e.g., 'development' -> 'DEV')
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
