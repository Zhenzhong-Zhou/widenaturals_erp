/**
 * @file check-postgres-version.js
 * @description Validates the running Postgres major version against REQUIRED_PG_VERSION.
 *
 * Called at startup before any database initialization to prevent schema
 * operations against an incompatible Postgres version. Fails loudly so a
 * version mismatch is caught intentionally rather than corrupting silently.
 */

const { Pool } = require('pg');
const AppError = require('../../utils/AppError');
const {
  ERROR_TYPES,
  ERROR_CODES,
} = require('../../utils/constants/error-constants');
const { getConnectionConfig } = require('../../config/db-config');
const {
  logSystemInfo,
  logSystemWarn,
} = require('../../utils/logging/system-logger');

const CONTEXT = 'startup/check-postgres-version';

const connectionConfig = getConnectionConfig();

/**
 * Queries the running Postgres server version and compares the major version
 * against the REQUIRED_PG_VERSION environment variable.
 *
 * Connects to the default 'postgres' database so this check works before
 * the application database exists (e.g. during initial bootstrap).
 *
 * Throws if the versions do not match or if REQUIRED_PG_VERSION is not set.
 * This prevents migrations and schema operations from running against an
 * incompatible Postgres version after an unintended upgrade.
 *
 * @returns {Promise<void>}
 * @throws {AppError} If REQUIRED_PG_VERSION is not set.
 * @throws {AppError} If the running major version does not match REQUIRED_PG_VERSION.
 */
const checkPostgresVersion = async () => {
  // No silent fallback — if REQUIRED_PG_VERSION is unset, fail loudly.
  // A missing env var here means the check is effectively disabled,
  // which is worse than a startup failure.
  const requiredEnv = process.env.REQUIRED_PG_VERSION;
  if (!requiredEnv) {
    throw new AppError(
      'REQUIRED_PG_VERSION environment variable is not set',
      500,
      {
        type: ERROR_TYPES.SYSTEM,
        code: ERROR_CODES.CONFIGURATION_ERROR,
        context: CONTEXT,
      }
    );
  }

  // Use a temporary connection to 'postgres' (always exists)
  // so this check works before the app database is created
  const tempPool = new Pool({
    ...connectionConfig, // reuse host/port/user/password
    database: 'postgres',
  });

  try {
    const result = await tempPool.query('SHOW server_version;');
    const { server_version: full } = /** @type {{ server_version: string }} */ (
      result.rows[0]
    );
    const actual = parseInt(full, 10);
    const expected = parseInt(requiredEnv, 10);

    if (isNaN(expected)) {
      logSystemWarn(
        'REQUIRED_PG_VERSION is not a valid number — skipping version check',
        {
          context: CONTEXT,
          value: requiredEnv,
        }
      );
      return;
    }

    if (actual !== expected) {
      throw new AppError(
        `Postgres version mismatch: expected ${expected}, got ${actual} (${full})`,
        500,
        {
          type: ERROR_TYPES.SYSTEM,
          code: ERROR_CODES.CONFIGURATION_ERROR,
          context: CONTEXT,
          meta: { expected, actual, full },
        }
      );
    }

    logSystemInfo('Postgres version check passed', {
      context: CONTEXT,
      version: full,
    });
  } finally {
    await tempPool.end();
  }
};

module.exports = {
  checkPostgresVersion,
};
