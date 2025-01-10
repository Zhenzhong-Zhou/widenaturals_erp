/**
 * @file create-db.js
 * @description Script to check the existence of the target database, create it if necessary, and run migrations/seeds.
 */

const { Pool } = require('pg');
const { logInfo, logError } = require('../utils/logger-helper');
const { loadEnv } = require('../config/env');
const { getConnectionConfig, validateEnvVars } = require('../config/db-config');
const { retryDatabaseConnection, closePool } = require('./db');
const { onExit } = require('../utils/on-exit');
const knex = require('knex')(require('../../knexfile').development);

// Load environment variables
const { env } = loadEnv();

// Ensure all required environment variables are present
validateEnvVars();

// Connection configuration for the default administrative database
const adminConnectionConfig = {
  ...getConnectionConfig(),
  database: 'postgres', // Connect to 'postgres' for database-level operations
};

const targetDatabase = process.env.DB_NAME; // Target database name

/**
 * Initializes the database: checks existence, creates if necessary, and runs migrations/seeds.
 */
const createDatabaseAndInitialize = async () => {
  if (!targetDatabase) {
    logError('Environment variable DB_NAME is missing.');
    await onExit(1);
    return;
  }
  
  const adminPool = new Pool(adminConnectionConfig); // Temporary admin pool
  
  try {
    logInfo(`Checking for database: '${targetDatabase}' in '${env}' environment`);
    
    // Ensure admin connection is ready
    await retryDatabaseConnection(adminConnectionConfig, 5);
    
    // Query to check if the database exists
    const result = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    );
    
    if (result.rowCount === 0) {
      logInfo(`Database '${targetDatabase}' does not exist. Creating...`);
      await adminPool.query(`CREATE DATABASE "${targetDatabase}"`);
      logInfo(`Database '${targetDatabase}' created successfully.`);
    } else {
      logInfo(`Database '${targetDatabase}' already exists.`);
    }
    
    // Run migrations
    logInfo('Running database migrations...');
    await knex.migrate.latest();
    logInfo('Database migrations completed successfully.');
    
    // Run seeds
    logInfo('Running database seeds...');
    await knex.seed.run();
    logInfo('Database seeds executed successfully.');
  } catch (error) {
    logError(error, null, {
      additionalInfo: error.code === '3D000'
        ? `Database '${targetDatabase}' does not exist`
        : 'Unexpected error during database creation or initialization',
    });
    await onExit(1); // Exits with proper cleanup
  } finally {
    await adminPool.end(); // Close the temporary admin pool
    await knex.destroy(); // Close Knex connection
    logInfo('Database setup process completed.');
  }
};

// Export the function for reusability
module.exports = { createDatabaseAndInitialize };

// Self-executing script for standalone use
if (require.main === module) {
  createDatabaseAndInitialize()
    .then(() => logInfo('Database creation and initialization completed successfully.'))
    .catch(async (error) => {
      logError(error, null, { additionalInfo: 'Failed to set up database' });
      await onExit(1); // Handles errors and exits cleanly
    });
}
