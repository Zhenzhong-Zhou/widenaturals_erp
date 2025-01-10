/**
 * @file db.js
 * @description Centralized database connection and utility functions for application use.
 * Includes health checks, monitoring, retry logic, and graceful shutdown support.
 */

const { Pool } = require('pg');
const { logInfo, logError, logWarn, logDebug } = require('../utils/logger-helper');
const { getConnectionConfig } = require('../config/db-config');
const { loadEnv } = require('../config/env');

// Get environment-specific connection configuration
loadEnv();
const connectionConfig = getConnectionConfig();

// Configure the database connection pool
const pool = new Pool({
  ...connectionConfig,
  max: 10, // Maximum number of connections in the pool
  idleTimeoutMillis: 30000, // Time a client must sit idle before being closed
  connectionTimeoutMillis: 2000, // Time to wait for a connection before timing out
});

pool.on('connect', () => logInfo('Connected to the database'));
pool.on('error', (err) =>
  logError(err, null, { additionalInfo: 'Database connection error' })
);

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
  } catch (error) {
    logError(error, null, {
      additionalInfo: 'Database connection error', // Ensure consistency here
    });
    throw error; // Re-throw the error for upstream handling
  } finally {
    client.release(); // Release the client back to the pool
  }
};

/**
 * Directly acquire a client for managing transactions.
 * @returns {Promise<object>} - The connected client.
 */
const getClient = async () => {
  return await pool.connect();
};

/**
 * Test the database connection.
 * Useful for health checks or startup validation.
 * @returns {Promise<void>}
 */
const testConnection = async () => {
  try {
    await query('SELECT 1'); // Simple query to test connectivity
    logInfo('Database connection is healthy.');
  } catch (error) {
    logError(error, null, {
      additionalInfo: 'Database connection test failed',
    });
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
 * Gracefully shuts down the database connection pool.
 * Ensures that `pool.end()` is only called once to avoid errors.
 * @returns {Promise<void>}
 */
let poolClosed = false; // Flag to track if the pool has already been closed

const closePool = async () => {
  if (poolClosed) {
    logWarn('Attempted to close the database connection pool, but it is already closed.');
    return; // Prevent multiple calls
  }
  
  try {
    logDebug('closePool called.');
    logInfo('Closing database connection pool...');
    await pool.end(); // Close all connections in the pool
    logInfo('Database connection pool closed.');
    poolClosed = true; // Mark the pool as closed
  } catch (error) {
    logError('Error closing database connection pool:', null, {
      additionalInfo: error.message,
      stack: error.stack,
    });
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
      return await fn(); // Attempt to execute the function
    } catch (error) {
      attempt++;
      logWarn(`Retry ${attempt}/${retries} failed: ${error.message}`); // Log warning for every failure
      if (attempt === retries) throw error; // Exhaust retries, throw error
      await delay(1000 * Math.pow(2, attempt)); // Exponential backoff
    }
  }
};

/**
 * Retry database connection using a pool.
 * @param {Object} config - Database configuration.
 * @param {number} retries - Maximum number of retry attempts.
 */
const retryDatabaseConnection = async (config, retries = 5) => {
  const tempPool = new Pool(config); // Temporary pool for retrying
  let attempts = 0;
  
  while (attempts < retries) {
    try {
      const client = await tempPool.connect(); // Attempt to connect using the pool
      logInfo('Database connected successfully!');
      client.release(); // Release the client back to the pool
      
      await tempPool.end(); // Close the temporary pool after success
      return;
    } catch (error) {
      attempts++;
      logError(`Database connection attempt ${attempts} failed:`, error.message);
      
      if (attempts === retries) {
        await tempPool.end(); // Ensure the temporary pool is closed after the final attempt
        throw new Error('Failed to connect to the database after multiple attempts.');
      }
      
      await new Promise((res) => setTimeout(res, 5000)); // Wait 5 seconds before retrying
    }
  }
};

// Export the utilities
module.exports = { pool, query, getClient, closePool, testConnection, monitorPool, retry, retryDatabaseConnection };
