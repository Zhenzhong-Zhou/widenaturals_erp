/**
 * @file create-db.js
 * @description Script to check the existence of the target database and create it if it does not exist.
 * Uses the default administrative database (postgres) to perform database-level operations.
 */

const { Pool } = require('pg'); // Use Pool for direct DB connection
const { logInfo, logError } = require('../utils/logger-helper');
const { loadEnv } = require('../config/env');
const { getConnectionConfig, validateEnvVars } = require('../config/db-config');

// Load environment variables
const env = loadEnv();

// Ensure all required environment variables are present
validateEnvVars();

// Connection configuration for the default administrative database
const adminConnectionConfig = {
  ...getConnectionConfig(),
  database: 'postgres', // Ensure connection to 'postgres'
};

const targetDatabase = process.env.DB_NAME; // Target database name

/**
 * Checks if the target database exists and creates it if necessary.
 */
const createDatabase = async () => {
  const pool = new Pool(adminConnectionConfig); // Temporary pool for administrative operations
  
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
  } catch (error) {
    if (error.code === '3D000') {
      logError(error, null, {
        additionalInfo: `Database '${targetDatabase}' does not exist`,
      });
    } else {
      logError(error, null, {
        additionalInfo: 'Unexpected error during database creation process',
      });
    }
    process.exit(1); // Exit process with failure code
  } finally {
    await pool.end(); // Close the pool to release resources
    logInfo('Database creation process completed.');
  }
};

// Export the function for reusability
module.exports = { createDatabase };

// Self-executing script for standalone use
if (require.main === module) {
  createDatabase()
    .then(() => {
      logInfo('Database check and creation process completed successfully.');
    })
    .catch((error) => {
      logError(error, null, { additionalInfo: 'Failed to create database' });
      process.exit(1);
    });
}
