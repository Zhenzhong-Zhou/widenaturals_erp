/**
 * @file db.js
 * @description Centralized database connection and utility functions for application use.
 * Includes health checks, monitoring, retry logic, and graceful shutdown support.
 */

const { Pool } = require('pg');
const { logInfo, logError, logWarn } = require('../utils/loggerHelper');
const { getConnectionConfig } = require('../config/db-config');
const { getEnvPrefix, loadEnv } = require('../config/env');

// Get environment-specific connection configuration
const env = loadEnv();
const envPrefix = getEnvPrefix(env);
const connectionConfig = getConnectionConfig(envPrefix);

// Configure the database connection pool
const pool = new Pool({
  ...connectionConfig,
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Time a client must sit idle before being closed
  connectionTimeoutMillis: 2000, // Time to wait for a connection before timing out
});

pool.on('connect', () => logInfo('Connected to the database'));
pool.on('error', (err) => logError(err, null, { additionalInfo: 'Database connection error' }));

/**
 * Execute a query on the database.
 * @param {string} text - The SQL query string.
 * @param {Array} [params] - Query parameters (optional).
 * @returns {Promise<object>} - The query result.
 */
const query = async (text, params = []) => {
  const client = await pool.connect(); // Acquire a client from the pool
  try {
    return await client.query(text, params); // Execute the query
  } finally {
    client.release(); // Release the client back to the pool
  }
};

/**
 * Test the database connection.
 * Useful for health checks or startup validation.
 * @returns {Promise<void>}
 */
const testConnection = async () => {
  try {
    await query('SELECT 1'); // Simple query to ensure connectivity
    logInfo('Database connection is healthy.');
  } catch (error) {
    logError(error, null, { additionalInfo: 'Database connection test failed' });
    throw error;
  }
};

/**
 * Monitor connection pool statistics.
 * Logs the current state of the connection pool.
 */
const monitorPool = () => {
  logInfo(`Pool Status:
  - Total Clients: ${pool.totalCount}
  - Idle Clients: ${pool.idleCount}
  - Waiting Requests: ${pool.waitingCount}`);
};

/**
 * Gracefully shutdown the database connection pool.
 * Should be called during application shutdown to release resources.
 * @returns {Promise<void>}
 */
const closePool = async () => {
  try {
    logInfo('Closing database connection pool...');
    await pool.end(); // Close all connections in the pool
    logInfo('Database connection pool closed.');
  } catch (error) {
    logError(error, null, { additionalInfo: 'Error closing database connection pool' });
  }
};

/**
 * Retry a function with exponential backoff.
 * Useful for handling transient database issues.
 * @param {Function} fn - The function to execute (e.g., a query function).
 * @param {number} retries - Maximum number of retry attempts.
 * @returns {Promise<any>} - The result of the function call.
 */
const retry = async (fn, retries = 3) => {
  let attempt = 0;
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  
  while (attempt < retries) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt === retries) throw error; // Throw error if max retries reached
      logWarn(`Retry ${attempt}/${retries} failed: ${error.message}`);
      await delay(1000 * Math.pow(2, attempt)); // Exponential backoff
    }
  }
};

// Export the utilities
module.exports = { pool, query, closePool, testConnection, monitorPool, retry };
