/**
 * @file initialize-database.js
 * @description Database startup initialization script.
 *
 * Responsibilities:
 * - Verify Postgres major version compatibility
 * - Ensure database connectivity (with retry)
 * - Check if target database exists
 * - Create database if missing (idempotent)
 * - Run migrations (fail fast)
 * - Run seeds (fail fast)
 *
 * Design Principles:
 * - Step-based execution using runStartupStep
 * - Consistent structured logging
 * - Fail-fast for deterministic steps (migrations/seeds)
 * - Re-throws on failure — caller owns lifecycle/exit decisions
 * - Safe cleanup of resources in finally (adminPool + knex)
 */

const { Pool } = require('pg');
const { loadEnv } = require('../../config/env');
const { getConnectionConfig } = require('../../config/db-config');
const {
  logSystemInfo,
  logSystemException,
} = require('../../utils/logging/system-logger');
const { retryDatabaseConnection } = require('../../database/db');
const { handleExit } = require('../lifecycle/on-exit');
const { runStartupStep } = require('../lifecycle/run-startup-step');
const { checkPostgresVersion } = require('./check-postgres-version');

const CONTEXT = 'startup/initialize-database';

/**
 * Orchestrates the full database initialization workflow at server startup.
 *
 * Runs synchronous steps in order — each step must succeed before the next
 * begins. On failure, logs the error and re-throws so the caller (server.js)
 * can decide whether to exit or retry.
 *
 * Steps:
 *   0. Check Postgres version   — refuses incompatible major versions
 *   1. Retry DB connection      — exponential backoff, configurable retries
 *   2. Check DB existence       — queries pg_database
 *   3. Create DB if missing     — idempotent, skipped if already exists
 *   4. Run migrations           — fail fast on any migration error
 *   5. Run seeds                — fail fast on any seed error
 *
 * @returns {Promise<void>}
 * @throws {Error} If any initialization step fails.
 */
const createDatabaseAndInitialize = async () => {
  //--------------------------------------------------
  // Resolve env at call time — not module load time
  // ensures loadEnv() has already run before we read vars
  //--------------------------------------------------
  const { env } = loadEnv();
  
  const targetDatabase = process.env.DB_NAME;
  if (!targetDatabase) {
    throw new Error('DB_NAME environment variable is missing');
  }
  
  //--------------------------------------------------
  // Resolve knex at call time using current NODE_ENV
  // — avoids hardcoding 'development' at module level
  //--------------------------------------------------
  const environment = process.env.NODE_ENV || 'development';
  const knex = require('knex')(require('../../../knexfile')[environment]);
  
  const adminConnectionConfig = {
    ...getConnectionConfig(),
    database: 'postgres', // connect to admin DB to check/create target DB
  };
  
  const adminPool = new Pool(adminConnectionConfig);
  
  try {
    logSystemInfo('Starting database initialization', {
      context: CONTEXT,
      targetDatabase,
      env,
      environment,
    });
    
    //--------------------------------------------------
    // Step 0 — Verify Postgres major version
    // Must run before any schema or migration work
    //--------------------------------------------------
    await runStartupStep(
      'Check Postgres version',
      () => checkPostgresVersion(),
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Step 1 — Ensure DB connectivity with retry
    // Handles transient failures on container startup
    //--------------------------------------------------
    await runStartupStep(
      'Ensure database connection',
      () => retryDatabaseConnection(adminConnectionConfig, {
        retries:     5,
        baseDelayMs: 500,
        maxDelayMs:  5000,
        context:     CONTEXT,
      }),
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Step 2 — Check if target database exists
    //--------------------------------------------------
    const result = await runStartupStep(
      'Check database existence',
      () => adminPool.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [targetDatabase]
      ),
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Step 3 — Create database if missing
    //--------------------------------------------------
    if (result.rowCount === 0) {
      await runStartupStep(
        'Create database',
        () => adminPool.query(`CREATE DATABASE "${targetDatabase}"`),
        { context: CONTEXT }
      );
    } else {
      logSystemInfo('Database already exists — skipping creation', {
        context: CONTEXT,
        targetDatabase,
      });
    }
    
    //--------------------------------------------------
    // Step 4 — Run migrations
    // Uses environment-resolved knex config
    //--------------------------------------------------
    await runStartupStep(
      'Run migrations',
      () => knex.migrate.latest(),
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Step 5 — Run seeds
    //--------------------------------------------------
    await runStartupStep(
      'Run seeds',
      () => knex.seed.run(),
      { context: CONTEXT }
    );
    
    logSystemInfo('Database initialization completed successfully', {
      context: CONTEXT,
      targetDatabase,
    });
    
  } catch (error) {
    logSystemException(error, 'Database initialization failed', {
      context: CONTEXT,
      targetDatabase,
      errorCode: error.code,
    });
    
    // Re-throw — let the caller (server.js) own the exit decision.
    // Do NOT call handleExit here — server.js runStartupStep handles it.
    throw error;
    
  } finally {
    // Always clean up pool and knex regardless of success or failure
    await adminPool.end().catch(() => {});
    await knex.destroy().catch(() => {});
  }
};

module.exports = { createDatabaseAndInitialize };

//--------------------------------------------------
// CLI execution
// node system/startup/initialize-database.js
//--------------------------------------------------
if (require.main === module) {
  createDatabaseAndInitialize()
    .then(() =>
      logSystemInfo('Database initialization completed successfully', {
        context: CONTEXT,
      })
    )
    .catch(async (error) => {
      logSystemException(error, 'Startup script failed', { context: CONTEXT });
      await handleExit(1);
    });
}
