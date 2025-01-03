/**
 * @file create-db.js
 * @description Script to check the existence of the target database and create it if it does not exist.
 * Uses the default administrative database (postgres) to perform database-level operations.
 */

const { Pool } = require('pg'); // Use Pool for direct DB connection
const { loadEnv, getEnvPrefix } = require('../config/env');
const { getConnectionConfig } = require('../config/db-config');

// Load environment variables
const env = loadEnv();
const envPrefix = getEnvPrefix(env);

// Validate required environment variables
const validateEnvVars = () => {
  const requiredVars = [`${envPrefix}_DB_NAME`, `${envPrefix}_DB_HOST`, `${envPrefix}_DB_USER`, `${envPrefix}_DB_PASSWORD`];
  const missingVars = requiredVars.filter((key) => !process.env[key]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
  }
};

// Ensure all required environment variables are present
validateEnvVars();

// Connection configuration for the default administrative database
const adminConnectionConfig = {
  ...getConnectionConfig(envPrefix),
  database: 'postgres', // Ensure connection to 'postgres'
};

const targetDatabase = process.env[`${envPrefix}_DB_NAME`]; // Target database name

const log = (message) => {
  console.log(`[${new Date().toISOString()}] ${message}`);
};

/**
 * Checks if the target database exists and creates it if necessary.
 */
const createDatabase = async () => {
  const pool = new Pool(adminConnectionConfig); // Temporary pool for administrative operations
  
  try {
    log(`🔄 Checking for database: '${targetDatabase}' in '${env}' environment`);
    
    // Query to check if the database exists
    const result = await pool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDatabase]
    );
    
    if (result.rowCount === 0) {
      console.log(`❌ Database '${targetDatabase}' does not exist. Creating...`);
      await pool.query(`CREATE DATABASE "${targetDatabase}"`);
      console.log(`✅ Database '${targetDatabase}' created successfully.`);
    } else {
      console.log(`✅ Database '${targetDatabase}' already exists.`);
    }
  } catch (error) {
    if (error.code === '3D000') {
      log(`❌ Database '${targetDatabase}' does not exist: ${error.message}`);
    } else {
      log(`❌ Unexpected error: ${error.message}`);
    }
    process.exit(1); // Exit process with failure code
  } finally {
    await pool.end(); // Close the pool to release resources
  }
};

// Export the function for reusability
module.exports = { createDatabase };

// Self-executing script for standalone use
if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log('✅ Database check and creation process completed successfully.');
    })
    .catch((error) => {
      console.error(`❌ Failed to create database: ${error.message}`);
      process.exit(1);
    });
}
