/**
 * @file create-db.js
 * @description Script to check the existence of the target database and create it if it does not exist.
 * Uses the default administrative database (postgres) to perform database-level operations.
 */

const { Pool } = require('pg'); // Use Pool for direct DB connection
const { getEnvPrefix } = require('../config/env');
const { getConnectionConfig } = require('../config/db-config');

// Get environment-specific configuration
const envPrefix = getEnvPrefix(process.env.NODE_ENV || 'development');
const targetDatabase = process.env[`${envPrefix}_DB_NAME`]; // Target database name

// Connection configuration for the default administrative database
const adminConnectionConfig = {
  ...getConnectionConfig(envPrefix),
  database: 'postgres', // Ensure connection to 'postgres'
};

/**
 * Checks if the target database exists and creates it if necessary.
 */
const createDatabase = async () => {
  const pool = new Pool(adminConnectionConfig); // Temporary pool for administrative operations
  
  try {
    console.log(`🔄 Checking if database '${targetDatabase}' exists...`);
    
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
    console.error(`❌ Error during database creation: ${error.message}`);
    process.exit(1); // Exit process with failure code
  } finally {
    await pool.end(); // Close the pool to release resources
  }
};

// Execute the database creation logic
createDatabase()
  .then(() => {
    console.log('✅ Database check and creation process completed.');
  })
  .catch((error) => {
    console.error(`❌ Failed during database creation: ${error.message}`);
    process.exit(1); // Exit process with failure code
  });
