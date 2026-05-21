/**
 * @file env.js
 * @description Environment bootstrap utilities for loading secrets, resolving
 * dotenv files, and validating required configuration before application startup.
 *
 * Responsibilities:
 * - Load environment variables from layered dotenv files
 * - Resolve secret values from Docker secrets with environment fallback
 * - Apply default values for optional configuration
 * - Validate required configuration at startup
 *
 * Context:
 * - Runs during system/bootstrap phase
 * - Executes outside the request lifecycle
 *
 * Design:
 * - Fail fast on invalid or missing startup configuration
 * - Use system-level logging only
 * - Throw initialization errors for bootstrap-critical failures
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const {
  logSystemFatal,
} = require('../utils/logging/system-logger');
const AppError = require('../utils/AppError');

const ENV_CONTEXT = 'env-loader';
const ALLOWED_ENVS = ['development', 'test', 'staging', 'production'];
const DEBUG = process.env.DEBUG_ENV_LOADER === 'true';

/**
 * Loads a secret from Docker secrets if present, otherwise falls back to the
 * corresponding environment variable.
 *
 * @param {string} secretName - Docker secret file name under /run/secrets.
 * @param {string} envVarName - Fallback environment variable name.
 * @returns {string|null} Resolved secret value, or null if unavailable.
 */
const loadSecret = (secretName, envVarName) => {
  const secretPath = `/run/secrets/${secretName}`;

  try {
    return fs.readFileSync(secretPath, 'utf-8').trim();
  } catch {
    return process.env[envVarName] ?? null;
  }
};

/**
 * Loads dotenv files based on the current NODE_ENV value.
 *
 * Load order (env-specific files take precedence over defaults):
 * 1. .env.{env}.server
 * 2. .env.{env}.database
 * 3. .env.defaults                    // fallback values only
 *
 * Missing files are skipped silently. Set DEBUG_ENV_LOADER=true to log
 * which files were loaded or skipped (uses console directly — runs before
 * the app logger is initialized).
 *
 * @returns {{ env: string }} The normalized runtime environment.
 * @throws {AppError} When NODE_ENV is invalid or cannot be normalized.
 */
const loadEnv = () => {
  const env = process.env.NODE_ENV?.trim().toLowerCase() || 'development';

  if (!ALLOWED_ENVS.includes(env)) {
    throw AppError.initializationError(
      `Invalid NODE_ENV: ${env}. Allowed values: ${ALLOWED_ENVS.join(', ')}`
    );
  }

  const envPaths = [
    path.resolve(__dirname, '../../../env/.env.defaults'),
    path.resolve(__dirname, `../../../env/${env}/.env.server`),
    path.resolve(__dirname, `../../../env/${env}/.env.database`),
  ];

  envPaths.forEach((filePath) => {
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath });
      if (DEBUG) console.info('[env-loader] loaded', { filePath, env });
    } else if (DEBUG) {
      console.warn('[env-loader] not found', { filePath, env });
    }
  });

  return { env };
};

/**
 * Applies default values to environment variables when they are not already set.
 *
 * @param {Record<string, Array<{ envVar: string, defaultValue?: any }>>} groups
 * Environment variable groups.
 * @returns {void}
 */
const applyEnvDefaults = (groups) => {
  for (const vars of Object.values(groups)) {
    vars.forEach(({ envVar, defaultValue }) => {
      if (process.env[envVar] == null && defaultValue !== undefined) {
        process.env[envVar] = String(defaultValue);
      }
    });
  }
};

/**
 * Validates required environment variables and secret-backed configuration.
 *
 * Expected group item shape:
 * - envVar: string
 * - required?: boolean
 * - defaultValue?: any
 * - secret?: () => string|null
 * - validate?: (value: string) => boolean
 *
 * Behavior:
 * - Applies defaults before validation
 * - Resolves values from secret() when provided
 * - Applies custom validation when validate() is defined
 * - Fails fast if required values are missing or invalid
 *
 * @param {Record<string, Array<{
 *   envVar: string,
 *   required?: boolean,
 *   defaultValue?: any,
 *   secret?: () => (string|null),
 *   validate?: (value: string) => boolean
 * }>>} groups
 * @returns {void}
 * @throws {AppError} When required configuration is missing or invalid.
 */
const validateEnv = (groups) => {
  const missingVars = [];
  const invalidVars = [];

  // Apply defaults first so validation reflects final effective config.
  applyEnvDefaults(groups);

  for (const vars of Object.values(groups)) {
    vars.forEach(({ envVar, secret, required, validate }) => {
      const value = secret ? secret() : process.env[envVar];

      if (required && (value == null || value === '')) {
        missingVars.push(envVar);
        return;
      }

      if (value != null && typeof validate === 'function' && !validate(value)) {
        invalidVars.push(envVar);
      }
    });
  }

  if (missingVars.length > 0) {
    logSystemFatal('Missing required environment variables or secrets', {
      context: ENV_CONTEXT,
      missingVars,
    });

    throw AppError.initializationError(
      `Missing required environment variables or secrets: ${missingVars.join(', ')}`
    );
  }

  if (invalidVars.length > 0) {
    logSystemFatal('Invalid environment variable values detected', {
      context: ENV_CONTEXT,
      invalidVars,
    });

    throw AppError.initializationError(
      `Invalid environment variable values: ${invalidVars.join(', ')}`
    );
  }
};

/**
 * Reads a required environment variable, narrowing the type from
 * `string | undefined` to `string`.
 *
 * Assumes {@link validateEnv} has already run during bootstrap, so the
 * throw here is purely a defensive safety net for cases where this is
 * called before validation (e.g. test harnesses, ad-hoc scripts) or
 * for a variable that wasn't registered in the validation groups.
 *
 * @param {string} name - Environment variable name.
 * @returns {string} The non-empty value of the environment variable.
 * @throws {AppError} If the variable is undefined or empty.
 */
const readRequiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw AppError.initializationError(
      `Environment variable read before validation or unregistered: ${name}`,
      { context: ENV_CONTEXT, envVar: name }
    );
  }
  return value;
};

module.exports = {
  loadEnv,
  validateEnv,
  loadSecret,
  readRequiredEnv
};
