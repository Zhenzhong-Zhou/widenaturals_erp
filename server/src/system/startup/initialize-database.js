/**
 * @file initialize-database.js
 * @description Database startup initialization script.
 *
 * Responsibilities:
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
 * - Safe cleanup of resources (pool + knex)
 */

const { Pool } = require('pg');
const knex = require('knex')(require('../../../knexfile').development);
const { loadEnv } = require('../../config/env');
const { getConnectionConfig } = require('../../config/db-config');
const {
  logSystemInfo,
  logSystemFatal,
  logSystemException,
} = require('../../utils/logging/system-logger');
const { retryDatabaseConnection } = require('../../database/db');
const { handleExit } = require('../lifecycle/on-exit');
const { runStartupStep } = require('../lifecycle/run-startup-step');

//--------------------------------------------------
// Environment setup
//--------------------------------------------------
const { env } = loadEnv();

// Connection configuration for the default administrative database
const adminConnectionConfig = {
  ...getConnectionConfig(),
  database: 'postgres',
};

const targetDatabase = process.env.DB_NAME;

const CONTEXT = 'startup/initialize-database/createDatabaseAndInitialize';

/**
 * Orchestrates full database initialization workflow.
 *
 * @returns {Promise<void>}
 */
const createDatabaseAndInitialize = async () => {
  //--------------------------------------------------
  // Validate environment
  //--------------------------------------------------
  if (!targetDatabase) {
    logSystemFatal('DB_NAME environment variable is missing', {
      context: CONTEXT,
    });
    await handleExit(1);
    return;
  }
  
  const adminPool = new Pool(adminConnectionConfig);
  
  try {
    logSystemInfo('Starting database initialization', {
      context: CONTEXT,
      targetDatabase,
      env,
    });
    
    //--------------------------------------------------
    // Step 1: Ensure DB connection (retry-safe)
    //--------------------------------------------------
    await runStartupStep(
      'Ensure database connection',
      async () => {
        await retryDatabaseConnection(adminConnectionConfig, {
          retries: 5,
          context : CONTEXT,
        });
      },
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Step 2: Check DB existence
    //--------------------------------------------------
    const result = await runStartupStep(
      'Check database existence',
      async () => {
        return adminPool.query(
          `SELECT 1 FROM pg_database WHERE datname = $1`,
          [targetDatabase]
        );
      },
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Step 3: Create DB if missing
    //--------------------------------------------------
    if (result.rowCount === 0) {
      await runStartupStep(
        'Create database',
        async () => {
          await adminPool.query(`CREATE DATABASE "${targetDatabase}"`);
        },
        { context: CONTEXT }
      );
    } else {
      logSystemInfo('Database already exists', {
        context: CONTEXT,
      });
    }
    
    //--------------------------------------------------
    // Step 4: Run migrations (fail fast)
    //--------------------------------------------------
    await runStartupStep(
      'Run migrations',
      async () => {
        await knex.migrate.latest();
      },
      { context: CONTEXT }
    );
    
    //--------------------------------------------------
    // Step 5: Run seeds (fail fast)
    //--------------------------------------------------
    await runStartupStep(
      'Run seeds',
      async () => {
        await knex.seed.run();
      },
      { context: CONTEXT }
    );
    
  } catch (error) {
    //--------------------------------------------------
    // Global failure handler
    //--------------------------------------------------
    logSystemException(error, 'Database initialization failed', {
      context: CONTEXT,
      targetDatabase,
      errorCode: error.code,
    });
    
    await handleExit(1);
  } finally {
    //--------------------------------------------------
    // Cleanup resources
    //--------------------------------------------------
    await adminPool.end();
    await knex.destroy();
    
    logSystemInfo('Database setup process completed', {
      context: CONTEXT,
    });
  }
};

module.exports = { createDatabaseAndInitialize };

//--------------------------------------------------
// CLI execution
//--------------------------------------------------
if (require.main === module) {
  createDatabaseAndInitialize()
    .then(() =>
      logSystemInfo('Database initialization completed successfully', {
        context: CONTEXT,
      })
    )
    .catch(async (error) => {
      logSystemException(error, 'Startup script failed', {
        context: CONTEXT,
      });
      await handleExit(1);
    });
}
