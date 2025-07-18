/**
 * @file create-db.js
 * @description Script to check the existence of the target database, create it if necessary, and run migrations/seeds.
 */

const { Pool } = require('pg');
const knex = require('knex')(require('../../knexfile').development);
const { loadEnv } = require('../config/env');
const { getConnectionConfig } = require('../config/db-config');
const {
  logSystemInfo,
  logSystemFatal,
  logSystemException,
} = require('../utils/system-logger');
const { retryDatabaseConnection } = require('./db');
const { handleExit } = require('../utils/on-exit');

// Load environment variables
const { env } = loadEnv();

// Connection configuration for the default administrative database
const adminConnectionConfig = {
  ...getConnectionConfig(),
  database: 'postgres',
};

const targetDatabase = process.env.DB_NAME;

/**
 * Initializes the database: checks existence, creates if necessary, and runs migrations/seeds.
 */
const createDatabaseAndInitialize = async () => {
  if (!targetDatabase) {
    logSystemFatal('DB_NAME environment variable is missing', {
      context: 'create-db',
      severity: 'critical',
    });
    await handleExit(1);
    return;
  }

  const adminPool = new Pool(adminConnectionConfig); // Temporary admin pool

  try {
    logSystemInfo(
      `Checking for database: '${targetDatabase}' in '${env}' environment`,
      {
        context: 'create-db',
      }
    );

    // Ensure admin connection is ready
    await retryDatabaseConnection(adminConnectionConfig, 5);

    // Query to check if the database exists
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    );

    if (result.rowCount === 0) {
      logSystemInfo(
        `Database '${targetDatabase}' does not exist. Creating...`,
        {
          context: 'create-db',
        }
      );
      await adminPool.query(`CREATE DATABASE "${targetDatabase}"`);
      logSystemInfo(`Database '${targetDatabase}' created successfully.`, {
        context: 'create-db',
      });
    } else {
      logSystemInfo(`Database '${targetDatabase}' already exists.`, {
        context: 'create-db',
      });
    }

    logSystemInfo('Running database migrations...', { context: 'create-db' });
    await knex.migrate.latest();
    logSystemInfo('Database migrations completed successfully.', {
      context: 'create-db',
    });

    // Run seeds
    logSystemInfo('Running database seeds...', { context: 'create-db' });
    await knex.seed.run();
    logSystemInfo('Database seeds executed successfully.', {
      context: 'create-db',
    });
  } catch (error) {
    logSystemException(error, 'Database creation or initialization failed', {
      context: 'create-db',
      targetDatabase,
      errorCode: error.code,
      severity: 'critical',
    });
    await handleExit(1); // Exits with proper cleanup
  } finally {
    await adminPool.end(); // Close the temporary admin pool
    await knex.destroy(); // Close Knex connection
    logSystemInfo('Database setup process completed.', {
      context: 'create-db',
    });
  }
};

// Export the function for reusability
module.exports = { createDatabaseAndInitialize };

// Self-executing script for standalone use
if (require.main === module) {
  createDatabaseAndInitialize()
    .then(() =>
      logSystemInfo(
        'Database creation and initialization completed successfully.',
        {
          context: 'create-db',
        }
      )
    )
    .catch(async (error) => {
      logSystemException(error, 'Failed to set up database', {
        context: 'create-db',
        severity: 'critical',
      });
      await handleExit(1); // Handles errors and exits cleanly
    });
}
