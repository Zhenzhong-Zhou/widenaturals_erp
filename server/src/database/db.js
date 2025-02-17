/**
 * @file db.js
 * @description Centralized database connection and utility functions for application use.
 * Includes health checks, monitoring, retry logic, and graceful shutdown support.
 */

const { Pool } = require('pg');
const { logInfo, logError, logWarn } = require('../utils/logger-helper');
const { getConnectionConfig } = require('../config/db-config');
const { loadEnv } = require('../config/env');
const AppError = require('../utils/AppError');
const {
  maskSensitiveInfo,
  maskTableName,
} = require('../utils/sensitive-data-utils');
const { generateCountQuery } = require('../utils/db-utils');

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
pool.on('error', (err) => {
  logError('Database connection error', err);
  throw AppError.databaseError('Unexpected database connection error', {
    details: { error: err.message },
  });
});

/**
 * Execute a query on the database and monitor for slow execution times.
 * @param {string} text - The SQL query string.
 * @param {Array} [params] - Query parameters (optional).
 * @param clientOrPool
 * @returns {Promise<object>} - The query result.
 */
const query = async (text, params = [], clientOrPool = null) => {
  const client = clientOrPool || (await pool.connect()); // Use the provided client or acquire a new one
  const startTime = Date.now(); // Start timer for query execution
  let shouldRelease = false;

  try {
    if (!clientOrPool) shouldRelease = true; // Mark for release only if acquired here
    const result = await client.query(text, params); // Execute the query
    const duration = Date.now() - startTime;

    // Log slow queries
    const slowQueryThreshold =
      parseInt(process.env.SLOW_QUERY_THRESHOLD, 10) || 1000; // Default: 1000ms
    if (duration > slowQueryThreshold) {
      logWarn('Slow query detected', {
        query: text,
        params,
        duration: `${duration}ms`,
      });
    }

    logInfo('Query executed', { query: text, duration: `${duration}ms` });
    return result;
  } catch (error) {
    logError('Query execution failed', {
      query: text,
      params,
      error: error.message,
    });
    throw AppError.databaseError('Database query failed', {
      details: { query: text, params, error: error.message },
    });
  } finally {
    if (shouldRelease) client.release(); // Release the client back to the pool only if acquired here
  }
};

/**
 * Directly acquire a client for managing transactions.
 * @returns {Promise<object>} - The connected client.
 */
const getClient = async () => {
  try {
    return await pool.connect();
  } catch (error) {
    throw AppError.databaseError('Failed to acquire a database client', {
      details: { error: error.message },
    });
  }
};

/**
 * Wraps a database operation in a transaction.
 *
 * @param {Function} callback - The function to execute within the transaction.
 *                              It receives the database client as an argument.
 * @returns {Promise<any>} - The result of the transaction.
 * @throws {Error} - Rethrows any errors encountered during the transaction.
 */
const withTransaction = async (callback) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
    logError('Database connection test failed', error);
    throw AppError.healthCheckError('Database connection test failed', {
      details: { error: error.message },
    });
  }
};

/**
 * Logs current pool statistics.
 * Useful for monitoring pool health.
 * @returns {Promise<object>} - The current pool metrics.
 */
const monitorPool = async () => {
  try {
    const metrics = {
      totalClients: pool.totalCount,
      idleClients: pool.idleCount,
      waitingRequests: pool.waitingCount,
    };

    logInfo('Pool health metrics:', metrics);
    return metrics;
  } catch (error) {
    logError('Error during pool monitoring:', error.message);
    throw AppError.serviceError('Failed to retrieve pool metrics', {
      details: { error: error.message },
    });
  }
};

/**
 * Gracefully shuts down the database connection pool.
 * Ensures that `pool.end()` is only called once to avoid errors.
 * @returns {Promise<void>}
 */
let poolClosed = false; // Flag to track if the pool has already been closed

const closePool = async () => {
  if (poolClosed) {
    logWarn(
      'Attempted to close the database connection pool, but it is already closed.'
    );
    return; // Prevent multiple calls
  }

  logInfo('Closing database connection pool...');

  try {
    await pool.end(); // Close all connections in the pool
    logInfo('Database connection pool closed.');
    poolClosed = true; // Mark the pool as closed
  } catch (error) {
    logError('Error closing database connection pool:', error.message);
    throw AppError.databaseError(
      'Failed to close the database connection pool',
      {
        details: { error: error.message },
      }
    );
  }
};

/**
 * Retry a function with exponential backoff.
 *
 * This utility is designed to handle transient issues, such as temporary database connectivity problems or external service failures.
 * It retries the provided function a specified number of times, with an exponentially increasing delay between attempts.
 *
 * @param {Function} fn - The function to execute. It should return a Promise (e.g., a database query or API call).
 * @param {number} [retries=3] - The maximum number of retry attempts before giving up.
 * @param {number} [backoffFactor=1000] - The base delay (in milliseconds) for the exponential backoff. Default is 1000ms.
 * @returns {Promise<any>} - Resolves with the result of the function if successful within the allowed retries.
 * @throws {Error} - Throws the last error encountered if all retries are exhausted.
 */
const retry = async (fn, retries = 3, backoffFactor = 1000) => {
  let attempt = 0;

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  while (attempt < retries) {
    try {
      return await fn(); // Attempt to execute the function
    } catch (error) {
      attempt++;
      logWarn(`Retry ${attempt}/${retries} failed: ${error.message}`, {
        attempt,
        retries,
      });

      if (attempt === retries) {
        throw AppError.serviceError('Function execution failed after retries', {
          details: { error: error.message, attempts: attempt, retries },
        });
      }

      await delay(backoffFactor * Math.pow(2, attempt)); // Configurable exponential backoff
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
      logError(
        `Database connection attempt ${attempts} failed:`,
        error.message
      );

      if (attempts === retries) {
        await tempPool.end(); // Ensure the temporary pool is closed after the final attempt
        throw AppError.databaseError(
          'Failed to connect to the database after multiple attempts.',
          {
            details: { attempts, retries, error: error.message },
          }
        );
      }

      await new Promise((res) => setTimeout(res, 5000)); // Wait 5 seconds before retrying
    }
  }
};

/**
 * Executes a paginated SQL query with optional sorting and filtering.
 *
 * @param {Object} options - The options for the paginated query.
 * @param {string} options.queryText - Base SQL query without pagination (e.g., "SELECT * FROM table_name WHERE condition").
 * @param {Array} [options.params=[]] - Query parameters for the base query.
 * @param {number} [options.page=1] - Current page number (1-based index).
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy='id'] - Column to sort by (default: 'id').
 * @param {string} [options.sortOrder='ASC'] - Sorting order ('ASC' or 'DESC').
 * @returns {Promise<Object>} - Returns an object with `data` (records) and `pagination` (metadata).
 * @throws {AppError} - Throws an error if the query execution fails.
 */
const paginateQuery = async ({
  tableName,
  joins = [],
  whereClause = '1=1',
  queryText,
  params = [],
  page = 1,
  limit = 10,
  sortBy = null,
  sortOrder = 'ASC',
  clientOrPool = pool,
  req = null, // Pass request context for logging
}) => {
  if (page < 1 || limit < 1) {
    throw new AppError.validationError(
      'Page and limit must be positive integers.',
      400,
      {
        type: 'ValidationError',
        isExpected: true,
      }
    );
  }

  const offset = (page - 1) * limit;

  // Generate the COUNT query dynamically
  const countQueryText = generateCountQuery(tableName, joins, whereClause);

  // Construct the paginated query
  let paginatedQuery = queryText;
  if (sortBy) {
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : 'ASC';
    paginatedQuery += ` ORDER BY ${sortBy} ${validSortOrder}`;
  }
  paginatedQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;

  // Append LIMIT and OFFSET to params
  const queryParams = [...params, limit, offset];

  try {
    // Execute both the paginated query and the count query in parallel
    const [dataResult, countResult] = await Promise.all([
      query(paginatedQuery, queryParams, clientOrPool),
      query(countQueryText, params, clientOrPool),
    ]);

    if (!countResult.rows.length) {
      throw new AppError('Failed to fetch total record count.', 500, {
        type: 'DatabaseError',
      });
    }

    const totalRecords = parseInt(countResult.rows[0]?.total || 0, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
      },
    };
  } catch (error) {
    logError('Error executing paginated query:', {
      queryText: paginatedQuery,
      countQueryText,
      params: [...params, limit, offset],
      error: error.message,
      stack: error.stack,
      context: req
        ? {
            ip: req.ip,
            method: req.method,
            route: req.originalUrl,
            userAgent: req.headers['user-agent'],
          }
        : {},
    });
    throw new AppError('Failed to execute paginated query.', 500, {
      type: 'DatabaseError',
      details: error.message,
    });
  }
};

/**
 * Locks a specific row in the given table using the specified lock mode.
 *
 * @param {object} client - The database client.
 * @param {string} table - The name of the table.
 * @param {string} id - The ID of the row to lock.
 * @param {string} [lockMode='FOR UPDATE'] - The lock mode (e.g., 'FOR UPDATE', 'FOR SHARE').
 * @returns {Promise<object>} - The locked row data.
 * @throws {AppError} - Throws an error if the table name or lock mode is invalid.
 */
const lockRow = async (client, table, id, lockMode = 'FOR UPDATE') => {
  const maskedId = maskSensitiveInfo(id, 'uuid');
  const maskTable = maskTableName(table);

  const allowedLockModes = [
    'FOR UPDATE',
    'FOR NO KEY UPDATE',
    'FOR SHARE',
    'FOR KEY SHARE',
  ];

  if (!allowedLockModes.includes(lockMode)) {
    throw AppError.validationError(`Invalid lock mode: ${lockMode}`);
  }

  // Fetch the primary key dynamically
  const primaryKeySql = `
    SELECT a.attname AS primary_key
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary;
  `;

  const tablePrimaryKey = await retry(async () => {
    const result = await client.query(primaryKeySql, [table]);
    if (result.rows.length === 0) {
      throw AppError.validationError(
        `No primary key found for table: ${maskTable}`
      );
    }
    return result.rows[0].primary_key;
  });

  const sql = `SELECT * FROM ${table} WHERE ${tablePrimaryKey} = $1 ${lockMode}`;

  return await retry(async () => {
    try {
      const result = await client.query(sql, [id]);
      if (result.rows.length === 0) {
        throw AppError.notFoundError(
          `Row with ID "${maskedId}" not found in table "${maskTable}"`
        );
      }
      return result.rows[0];
    } catch (error) {
      logError(
        `Error locking row in table "${maskTable}" with ID "${maskedId}" using lock mode "${lockMode}":`,
        {
          query: sql,
          params: [id],
          error: error.message,
        }
      );
      throw error; // Keep original error for retry logic
    }
  });
};

/**
 * Inserts multiple rows into a specified database table in bulk.
 *
 * This function dynamically generates an `INSERT` SQL statement for bulk insertion,
 * with support for conflict handling (`ON CONFLICT`) to either **do nothing** or **update specific columns**.
 *
 * @param {string} tableName - The name of the target table.
 * @param {string[]} columns - An array of column names for inserting values.
 * @param {Array<Array<any>>} rows - A 2D array where each inner array represents a row of values to insert.
 * @param {string[]} [conflictColumns=[]] - An array of column names that define a unique conflict condition.
 * @param {string[]} [updateColumns=[]] - An array of column names to update in case of conflict (if empty, `DO NOTHING` is applied).
 * @param {object} clientOrPool - The database client or pool instance to execute the query.
 * @returns {Promise<Array<Object>>} - A promise resolving to an array of inserted/updated rows.
 * @throws {AppError} - Throws an error if the query execution fails.
 *
 * @example
 * // Bulk insert without conflict handling
 * await bulkInsert('inventory', ['product_id', 'location_id', 'quantity'], [
 *   ['123', 'loc-1', 50],
 *   ['124', 'loc-2', 30]
 * ], [], [], pool);
 *
 * @example
 * // Bulk insert with conflict handling (DO NOTHING)
 * await bulkInsert('inventory', ['product_id', 'location_id', 'quantity'], [
 *   ['123', 'loc-1', 50],
 *   ['124', 'loc-2', 30]
 * ], ['product_id', 'location_id'], [], pool);
 *
 * @example
 * // Bulk insert with conflict handling (UPDATE quantity)
 * await bulkInsert('inventory', ['product_id', 'location_id', 'quantity'], [
 *   ['123', 'loc-1', 50],
 *   ['124', 'loc-2', 30]
 * ], ['product_id', 'location_id'], ['quantity'], pool);
 */
const bulkInsert = async (
  tableName,
  columns,
  rows,
  conflictColumns = [],
  updateColumns = [],  // Specify columns to update or leave empty for DO NOTHING
  clientOrPool = pool
) => {
  if (!rows.length) return 0;

  // Validate that rows are properly structured
  if (
    !Array.isArray(rows) ||
    !rows.every((row) => Array.isArray(row) && row.length === columns.length)
  ) {
    throw new AppError.validationError(
      `Invalid data format: Expected an array of arrays, each with ${columns.length} values`
    );
  }
  
  // Generate column names and placeholders
  const columnNames = columns.join(', ');
  const valuePlaceholders = rows
    .map(
      (_, rowIndex) =>
        `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
    )
    .join(', ');
  
  // Handle conflict dynamically: Either `DO NOTHING` or `DO UPDATE`
  let conflictClause = '';
  if (conflictColumns.length > 0) {
    if (updateColumns.length > 0) {
      // Construct dynamic UPDATE SET clause
      const updateSet = updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(', ');
      conflictClause = `ON CONFLICT (${conflictColumns.join(', ')}) DO UPDATE SET ${updateSet}`;
    } else {
      conflictClause = `ON CONFLICT (${conflictColumns.join(', ')}) DO NOTHING`;
    }
  }
  
  // Construct SQL query
  const sql = `
    INSERT INTO ${tableName} (${columnNames})
    VALUES ${valuePlaceholders}
    ${conflictClause}
    RETURNING id;
  `;
  
  // Flatten values for bulk insert
  const flattenedValues = rows.flat();

  try {
    const { rows: insertedRows } = await clientOrPool.query(sql, flattenedValues);
    return insertedRows;
  } catch (error) {
    logError('SQL Execution Error:', error);
    throw AppError.databaseError('Bulk insert failed', {
      details: { tableName, columns, error: error.message },
    });
  }
};

// Export the utilities
module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
  closePool,
  testConnection,
  monitorPool,
  retry,
  retryDatabaseConnection,
  paginateQuery,
  lockRow,
  bulkInsert,
};
