/**
 * @file create-db.js
 * @description Script to check the existence of the target database, create it if necessary, and run migrations/seeds.
 */

const { Pool } = require('pg'); // Use Pool for direct DB connection
const { logInfo, logError } = require('../utils/logger-helper');
const { loadEnv } = require('../config/env');
const { getConnectionConfig, validateEnvVars } = require('../config/db-config');
const knex = require('knex')(require('../../knexfile').development); // Import Knex with configuration

// Load environment variables
const env = loadEnv();

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
  const pool = new Pool(adminConnectionConfig);
  
  try {
    logInfo(
      `Checking for database: '${targetDatabase}' in '${env}' environment`
    );
    
    // Query to check if the database exists
    const result = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    );
    
    if (result.rowCount === 0) {
      logInfo(`Database '${targetDatabase}' does not exist. Creating...`);
      await pool.query(`CREATE DATABASE "${targetDatabase}"`);
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
    if (error.code === '3D000') {
      logError(error, null, {
        additionalInfo: `Database '${targetDatabase}' does not exist`,
      });
    } else {
      logError(error, null, {
        additionalInfo: 'Unexpected error during database creation process or initialization process',
      });
    }
    process.exit(1); // Exit process with failure code
  } finally {
    await pool.end(); // Close the administrative pool
    await knex.destroy(); // Close Knex connection
    logInfo('Database setup process completed.');
  }
};

// Export the function for reusability
module.exports = { createDatabaseAndInitialize };

// Self-executing script for standalone use
if (require.main === module) {
  createDatabaseAndInitialize()
    .then(() => {
      logInfo('Database creation and initialization process completed successfully.');
    })
    .catch((error) => {
      logError(error, null, { additionalInfo: 'Failed to set up database' });
      process.exit(1);
    });
}
