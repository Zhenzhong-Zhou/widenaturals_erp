/**
 * @file db.js
 * @description Centralized database connection and utility functions for application use.
 * Includes health checks, monitoring, retry logic, and graceful shutdown support.
 */

/** @typedef {import('pg').PoolClient} PoolClient */

const { Pool } = require('pg');
const { logDbConnect, logDbError, logRetryWarning, logDbSlowQuery, logDbQuerySuccess, logDbQueryError,
  logDbTransactionEvent, logDbPoolHealth, logDbPoolHealthError, logPaginatedQueryError, logLockRowError,
  logLockRowsError, logBulkInsertError, logGetStatusValueError
} = require('../utils/db-logger');
const { getConnectionConfig } = require('../config/db-config');
const { loadEnv } = require('../config/env');
const AppError = require('../utils/AppError');
const {
  maskSensitiveInfo,
  maskTableName,
} = require('../utils/sensitive-data-utils');
const { generateCountQuery } = require('../utils/db-utils');
const { logSystemException, logSystemInfo, logSystemWarn, logSystemDebug } = require('../utils/system-logger');
const { generateTraceId } = require('../utils/id-utils');
const { maskSensitiveParams } = require('../utils/mask-logger-params');

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

pool.on('connect', logDbConnect);
pool.on('error', (err) => {
  logDbError(err);
  throw AppError.databaseError('Unexpected database connection error', {
    details: { error: err },
  });
});

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
      
      const delayMs = backoffFactor * Math.pow(2, attempt);
      
      logRetryWarning(attempt, retries, error, delayMs);
      
      if (attempt === retries) {
        throw AppError.serviceError('Function execution failed after retries', {
          details: { error: error.message, attempts: attempt, retries },
        });
      }
      
      await delay(delayMs); // Configurable exponential backoff
    }
  }
};

/**
 * Executes a PostgreSQL query with retry and slow query monitoring.
 *
 * @param {string} text - SQL query string.
 * @param {Array} [params=[]] - Query parameters.
 * @param {object|null} [clientOrPool=null] - Optional pg client for transaction use.
 * @param {number} [retries=3] - Number of retry attempts.
 * @param {number} [backoff=200] - Backoff in ms between retries.
 * @param {Object} meta={} - Optional metadata for logging (e.g., traceId, txId, context).
 * @returns {Promise<object>} - Query result.
 * @throws {AppError} - Custom database error if all retries fail.
 */
const query = async (
  text,
  params = [],
  clientOrPool = null,
  retries = 3,
  backoff = 1000,
  meta = {}
) => {
  return retry(async () => {
    /** @type {PoolClient} */
    const client = clientOrPool || (await pool.connect());
    const shouldRelease = !clientOrPool;
    const startTime = Date.now();
    
    try {
      const result = await client.query(text, params);
      const duration = Date.now() - startTime;
      
      const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD, 10) || 1000;
      if (duration > slowQueryThreshold) {
        logDbSlowQuery(text, params, duration, meta);
      }
      
      logDbQuerySuccess(text, params, duration, meta);
      return result;
    } catch (error) {
      logDbQueryError(text, params, error, { context: 'pg-query', ...meta });
      
      throw AppError.databaseError('Database query failed', {
        details: { query: text, params, error: error.message },
      });
    } finally {
      if (shouldRelease && client) {
        client.release();
      }
    }
  }, retries, backoff);
};

/**
 * Directly acquires a PostgreSQL client from the pool for manual transaction control.
 *
 * @returns {Promise<PoolClient>} - The connected client.
 * @throws {AppError} - If acquiring the client fails.
 */
const getClient = async () => {
  try {
    return await pool.connect();
  } catch (error) {
    logSystemException(error, 'Failed to acquire a database client', {
      context: 'db-client',
      severity: 'critical',
    });
    
    throw AppError.databaseError('Failed to acquire a database client', {
      details: { error: error.message },
    });
  }
};

/**
 * Executes a database operation within a transaction.
 *
 * Begins a transaction, executes the provided callback using a PostgreSQL client,
 * commits on success, and rolls back on failure. Always releases the client.
 *
 *
 * @param {(client: PoolClient, txId: string) => Promise<any>} callback -
 *        The operation to run inside the transaction. Receives the client and a generated txId.
 *
 * @returns {Promise<any>} - The result returned by the callback.
 * @throws {AppError} - Rethrows any errors encountered, optionally wrapped as a database error.
 *
 * @example
 * await withTransaction(async (client, txId) => {
 *   await client.query('UPDATE orders SET status = $1 WHERE id = $2', ['paid', orderId]);
 *   logInfo('Order updated', null, { txId });
 * });
 */
const withTransaction = async (callback) => {
  const client = await getClient();
  const txId = generateTraceId();
  
  try {
    await client.query('BEGIN');
    logDbTransactionEvent('BEGIN', txId);
    
    const result = await callback(client);
    
    await client.query('COMMIT');
    logDbTransactionEvent('COMMIT', txId);
    
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logDbTransactionEvent('ROLLBACK', txId, { severity: 'critical' });
    
    logSystemException(error, 'Transaction failed', {
      txId,
      context: 'database',
      severity: 'critical',
    });
    
    if (!(error instanceof AppError)) {
      throw AppError.databaseError('Transaction failed', {
        details: { txId, originalError: error.message },
      });
    }
    
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Performs a basic database connectivity test.
 *
 * Executes a lightweight query to confirm the database is reachable.
 * Logs the result and throws a structured AppError on failure.
 *
 * @throws {AppError} - If the connectivity test fails.
 */
const testConnection = async () => {
  try {
    await query('SELECT 1'); // Simple query to test connectivity
    logSystemInfo('Database connection is healthy.', { context: 'healthcheck' });
  } catch (error) {
    logSystemException(error, 'Database connection test failed', {
      context: 'healthcheck',
      severity: 'critical',
    });
    
    throw AppError.healthCheckError('Database connection test failed', {
      details: { error: error.message },
    });
  }
};

/**
 * Logs current pool statistics.
 * Useful for monitoring pool health and client load.
 *
 * @returns {Promise<object>} - The current pool metrics.
 */
const monitorPool = async () => {
  try {
    const metrics = {
      totalClients: pool.totalCount,
      idleClients: pool.idleCount,
      waitingRequests: pool.waitingCount,
    };
    
    logDbPoolHealth(metrics);
    return metrics;
  } catch (error) {
    logDbPoolHealthError(error);
    
    throw AppError.serviceError('Failed to retrieve pool metrics', {
      details: { error: error.message },
    });
  }
};

let poolClosed = false; // Flag to track if the pool has already been closed

/**
 * Gracefully shuts down the database connection pool.
 * Ensures that `pool.end()` is only called once to avoid errors.
 * @returns {Promise<void>}
 */
const closePool = async () => {
  if (poolClosed) {
    logSystemWarn('Attempted to close the database connection pool, but it is already closed.', {
      context: 'shutdown',
    });
    return; // Prevent multiple calls
  }
  
  logSystemInfo('Closing database connection pool...', { context: 'shutdown' });

  try {
    await pool.end(); // Close all connections in the pool
    logSystemInfo('Database connection pool closed.', { context: 'shutdown' });
    poolClosed = true; // Mark the pool as closed
  } catch (error) {
    logSystemException(error, 'Error closing database connection pool', {
      context: 'shutdown',
      severity: 'critical',
    });
    
    throw AppError.databaseError(
      'Failed to close the database connection pool',
      {
        details: { error: error.message },
      }
    );
  }
};

/**
 * Retry database connection using a temporary pool.
 *
 * Useful during startup or testing to confirm database availability.
 *
 * @param {Object} config - PostgreSQL pool configuration.
 * @param {number} [retries=5] - Maximum number of retry attempts.
 * @returns {Promise<void>}
 * @throws {AppError} - If connection fails after all retries.
 */
const retryDatabaseConnection = async (config, retries = 5) => {
  const tempPool = new Pool(config);
  let attempts = 0;
  
  while (attempts < retries) {
    try {
      const client = await tempPool.connect(); // Attempt to connect using the pool
      logSystemInfo('Database connected successfully!', {
        context: 'db-connection-retry',
        attempt: attempts + 1,
        retries,
      });
      
      client.release(); // Release the client back to the pool
      await tempPool.end(); // Close the temporary pool after success
      return;
    } catch (error) {
      attempts++;
      
      logSystemWarn(`Database connection attempt ${attempts} failed`, {
        context: 'db-connection-retry',
        attempt: attempts,
        retries,
        errorMessage: error.message,
      });
      
      if (attempts === retries) {
        await tempPool.end(); // Ensure the temporary pool is closed after the final attempt
        logSystemException(error, 'All retry attempts to connect to the database failed', {
          context: 'db-connection-retry',
          attempts,
          retries,
          severity: 'critical',
        });
        
        throw AppError.databaseError('Failed to connect to the database after multiple attempts.', {
          details: { attempts, retries, error: error.message },
        });
      }
      
      await new Promise((res) => setTimeout(res, 5000)); // 5s delay before retry
    }
  }
};

/**
 * Appends ORDER BY, LIMIT, and OFFSET clauses to a base query.
 *
 * @param {string} baseQuery - The base SQL SELECT query (without LIMIT/OFFSET).
 * @param {string | null} sortBy - Column to sort by (optional).
 * @param {'ASC' | 'DESC'} sortOrder - Sort order (default: ASC).
 * @param {number} paramIndex - Starting index for bind parameters (usually params.length).
 * @returns {string} - The modified query with ORDER BY, LIMIT, and OFFSET.
 */
const buildPaginatedQuery = ({
                               baseQuery,
                               sortBy,
                               sortOrder = 'ASC',
                               paramIndex,
                             }) => {
  let query = baseQuery;
  
  if (sortBy) {
    const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase())
      ? sortOrder.toUpperCase()
      : 'ASC';
    query += ` ORDER BY ${sortBy} ${validSortOrder}`;
  }
  
  // LIMIT and OFFSET placeholders
  query += ` LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
  
  return query;
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
 * @param {Object} meta={} - Optional additional metadata.
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
  meta = {},
}) => {
  if (page < 1 || limit < 1) {
    throw AppError.validationError('Page and limit must be positive integers.');
  }

  const offset = (page - 1) * limit;

  // Generate the COUNT query dynamically
  const countQueryText = generateCountQuery(tableName, joins, whereClause);

  // Construct the paginated query
  const paginatedQuery = buildPaginatedQuery({
    baseQuery: queryText,
    sortBy,
    sortOrder,
    paramIndex: params.length,
  });

  // Append LIMIT and OFFSET to params
  const queryParams = [...params, limit, offset];

  try {
    // Execute both the paginated query and the count query in parallel
    const [dataResult, countResult] = await Promise.all([
      query(paginatedQuery, queryParams, clientOrPool),
      query(countQueryText, params, clientOrPool),
    ]);

    if (!countResult.rows.length) {
      throw AppError.databaseError('Failed to fetch total record count.');
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
    logPaginatedQueryError(error, paginatedQuery, countQueryText, queryParams, {
      page,
      limit,
      ...meta,
    });
    
    throw AppError.databaseError('Failed to execute paginated query.');
  }
};

/**
 * Executes a paginated SQL query using offset-based pagination.
 *
 * This utility is ideal for "Load More" or infinite scroll interfaces,
 * where you fetch records using `offset` and `limit` rather than page numbers.
 *
 * It supports custom joins, dynamic filtering, sorting, and total record counting.
 * The `queryText` should NOT include LIMIT or OFFSET clauses — they are added automatically.
 *
 * @param {string} tableName - The base table name or alias used in the query.
 * @param {string[]} joins - Optional SQL join clauses to include in both count and data queries.
 * @param {string} whereClause - SQL WHERE clause (default: '1=1') for filtering data.
 * @param {string} queryText - The base SELECT SQL query (without LIMIT/OFFSET).
 * @param {any[]} params - Array of query parameter values used in `queryText` and count query.
 * @param {number} offset - Number of records to skip (default: 0).
 * @param {number} limit - Number of records to return (default: 10).
 * @param {string | null} sortBy - Column name to sort by (optional).
 * @param {'ASC' | 'DESC'} sortOrder - Sort direction (default: 'ASC').
 * @param {any} clientOrPool - pg client or pool instance (default: `pool`).
 * @param {object} meta - Optional metadata used for logging context.
 *
 * @returns {Promise<{
 *   data: Record<string, any>[],
 *   pagination: {
 *     offset: number,
 *     limit: number,
 *     totalRecords: number,
 *     hasMore: boolean
 *   }
 * }>} - Returns the paginated result set and metadata.
 *
 * @throws {AppError} - Throws validation or database error if the query fails.
 */
const paginateQueryByOffset = async ({
                                       tableName,
                                       joins = [],
                                       whereClause = '1=1',
                                       queryText,
                                       params = [],
                                       offset = 0,
                                       limit = 10,
                                       sortBy = null,
                                       sortOrder = 'ASC',
                                       clientOrPool = pool,
                                       meta = {},
                                     }) => {
  if (offset < 0 || limit < 1) {
    throw AppError.validationError('Offset must be >= 0 and limit must be a positive integer.');
  }
  
  const countQueryText = generateCountQuery(tableName, joins, whereClause);
  
  const paginatedQuery = buildPaginatedQuery({
    baseQuery: queryText,
    sortBy,
    sortOrder,
    paramIndex: params.length,
  });
  
  const queryParams = [...params, limit, offset];
  
  try {
    const [dataResult, countResult] = await Promise.all([
      query(paginatedQuery, queryParams, clientOrPool),
      query(countQueryText, params, clientOrPool),
    ]);
    
    const totalRecords = parseInt(countResult.rows[0]?.total || 0, 10);
    
    return {
      data: dataResult.rows,
      pagination: {
        offset,
        limit,
        totalRecords,
        hasMore: offset + dataResult.rows.length < totalRecords,
      },
    };
  } catch (error) {
    logPaginatedQueryError(error, paginatedQuery, countQueryText, queryParams, {
      offset,
      limit,
      ...meta,
    });
    
    throw AppError.databaseError('Failed to execute offset-based paginated query.');
  }
};

/**
 * Wraps a complex SQL query into a count query.
 * Used for paginating CTEs or grouped queries.
 *
 * @param {string} queryText - The full query you want to count rows from.
 * @param {string} [alias='subquery'] - Optional alias for the wrapped subquery.
 * @returns {string} A SQL string that counts the rows of the input query.
 */
const getCountQuery = (queryText, alias = 'subquery') => {
  const trimmedQuery = queryText.trim().replace(/;$/, '');
  const countQuery = `SELECT COUNT(*) AS total_count FROM (${trimmedQuery}) AS ${alias}`;
  
  if (process.env.NODE_ENV !== 'production') {
    logSystemDebug('Generated count query', {
      context: 'query-builder',
      baseQuery: trimmedQuery,
      countQuery,
    });
  }
  
  return countQuery;
};

/**
 * Executes a paginated query and returns results with metadata.
 * Uses your internal `query()` function for consistency and logging.
 *
 * @param {Object} options - Query options.
 * @param {string} options.dataQuery - Base SQL query (no LIMIT/OFFSET).
 * @param {Array} [options.params=[]] - Parameters for the base query.
 * @param {number} [options.page=1] - Page number (1-based).
 * @param {number} [options.limit=20] - Page size.
 * @param {Object} [options.meta={}] - Optional metadata for logging (e.g., traceId, txId, context).
 * @returns {Promise<Object>} - Paginated results with metadata.
 */
const paginateResults = async ({
                                 dataQuery,
                                 params = [],
                                 page = 1,
                                 limit = 20,
                                 meta = {},
                               }) => {
  const offset = (page - 1) * limit;

  // Main paginated query
  const paginatedQuery = `${dataQuery.trim().replace(/;$/, '')} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const paginatedParams = [...params, limit, offset];

  // Generate a count query from original SQL
  const countQuery = getCountQuery(dataQuery);
  
  try {
    const [dataRows, countResult] = await Promise.all([
      query(paginatedQuery, paginatedParams),
      query(countQuery, params),
    ]);
    
    const totalRecords = parseInt(countResult.rows[0]?.total_count, 10) || 0;
    const totalPages = Math.ceil(totalRecords / limit);
    
    return {
      data: dataRows.rows || [],
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
      }
    };
  } catch (error) {
    logPaginatedQueryError(error, dataQuery, countQuery, params, {
      page,
      limit,
      ...meta,
    });
    
    throw AppError.databaseError('Failed to execute paginated results query.', {
      details: { page, limit, query: dataQuery, error: error.message },
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
 * @param {Object} meta={} - Optional additional metadata.
 * @returns {Promise<object>} - The locked row data.
 * @throws {AppError} - Throws an error if the table name or lock mode is invalid.
 */
const lockRow = async (client, table, id, lockMode = 'FOR UPDATE', meta={}) => {
  const maskedId = maskSensitiveInfo(id, 'uuid');
  const maskedTable = maskTableName(table);

  const allowedLockModes = [
    'FOR UPDATE',
    'FOR NO KEY UPDATE',
    'FOR SHARE',
    'FOR KEY SHARE',
  ];

  if (!allowedLockModes.includes(lockMode)) {
    throw AppError.validationError(`Invalid lock mode: ${lockMode}`);
  }
  
  // Step 1: Fetch the primary key dynamically
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
        `No primary key found for table: ${maskedTable}`
      );
    }
    return result.rows[0].primary_key;
  });
  
  // Step 2: Attempt to lock the row
  const sql = `SELECT * FROM ${table} WHERE ${tablePrimaryKey} = $1 ${lockMode}`;

  return await retry(async () => {
    try {
      const result = await client.query(sql, [id]);
      if (result.rows.length === 0) {
        throw AppError.notFoundError(
          `Row with ID "${maskedId}" not found in table "${maskedTable}"`
        );
      }
      return result.rows[0];
    } catch (error) {
      logLockRowError(error, sql, [id], maskTableName(table), lockMode, { ...meta });
      
      throw error; // Keep original error for retry logic
    }
  });
};

/**
 * Dynamically verifies if a table exists before locking rows.
 * Locks rows in a table using a specified lock mode.
 * Supports single ID, multiple IDs, or composite keys.
 *
 * @param {object} client - Database transaction client.
 * @param {string} table - The name of the table.
 * @param {Array|object} conditions - Either an array of IDs or an array of key-value conditions.
 * @param {string} [lockMode='FOR UPDATE'] - The lock mode.
 * @param {Object} meta={} - Optional additional metadata.
 * @returns {Promise<object[]>} - The locked rows.
 * @throws {AppError} - Throws an error if table name or lock mode is invalid.
 */
const lockRows = async (client, table, conditions, lockMode = 'FOR UPDATE', meta={}) => {
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw AppError.validationError(
      'Invalid conditions for row locking. Expected a non-empty array.'
    );
  }

  // Validate lock mode
  const validLockModes = [
    'FOR UPDATE',
    'FOR NO KEY UPDATE',
    'FOR SHARE',
    'FOR KEY SHARE',
  ];
  if (!validLockModes.includes(lockMode)) {
    throw AppError.validationError(
      `Invalid lock mode: ${lockMode}. Allowed: ${validLockModes.join(', ')}`
    );
  }

  // Dynamically check if the table exists in PostgreSQL
  const maskedTable = maskTableName(table);
  const tableExistsQuery = `SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename = $1)`;
  
  await retry(async () => {
    const { rows } = await client.query(tableExistsQuery, [table]);
    if (!rows[0].exists) {
      throw AppError.notFoundError(`Table "${maskedTable}" does not exist.`);
    }
  });

  let query, values;

  if (typeof conditions[0] === 'string') {
    // Case 1: Simple ID Locking (e.g., `lockRows(client, 'inventory', [uuid1, uuid2])`)
    const placeholders = conditions.map((_, i) => `$${i + 1}`).join(', ');
    query = `SELECT * FROM ${table} WHERE id IN (${placeholders}) ${lockMode}`;
    values = conditions;
  } else {
    // Case 2: Composite Key Locking (e.g., `lockRows(client, 'warehouse_inventory', [{ warehouse_id, inventory_id }])`)
    const whereClauses = conditions
      .map(
        (cond, i) =>
          `(${Object.keys(cond)
            .map(
              (key, j) => `${key} = $${i * Object.keys(cond).length + j + 1}`
            )
            .join(' AND ')})`
      )
      .join(' OR ');

    values = conditions.flatMap(Object.values);
    query = `SELECT * FROM ${table} WHERE ${whereClauses} ${lockMode}`;
  }

  try {
    return await retry(async () => {
      const { rows } = await client.query(query, values);
      // Log missing rows
      if (rows.length !== conditions.length) {
        logSystemWarn(`Some rows were not found in "${maskedTable}"`, {
          context: 'data-validation',
          table: maskedTable,
          expected: conditions.length,
          found: rows.length,
        });
      }

      return rows;
    });
  } catch (error) {
    logLockRowsError(error, query, values, maskTableName(table), { ...meta });
    
    throw AppError.databaseError(
      `Database error while locking rows in "${maskedTable}".`,
      {
        details: { error: error.message },
      }
    );
  }
};

/**
 * Builds an update clause for a specific column based on the provided strategy.
 *
 * @param {string} col - Column name.
 * @param {string} strategy - Strategy ('add', 'subtract', 'overwrite', etc.).
 * @param {string} tableAlias - Optional alias (default: 'table').
 * @returns {string} - SQL fragment for update.
 */
const applyUpdateRule = (col, strategy, tableAlias = 'table') => {
  switch (strategy) {
    case 'add': return `${col} = ${tableAlias}.${col} + EXCLUDED.${col}`;
    case 'subtract': return `${col} = ${tableAlias}.${col} - EXCLUDED.${col}`;
    case 'max': return `${col} = GREATEST(${tableAlias}.${col}, EXCLUDED.${col})`;
    case 'min': return `${col} = LEAST(${tableAlias}.${col}, EXCLUDED.${col})`;
    case 'coalesce': return `${col} = COALESCE(EXCLUDED.${col}, ${tableAlias}.${col})`;
    case 'overwrite':
    default: return `${col} = EXCLUDED.${col}`;
  }
};

/**
 * Inserts multiple rows into a specified database table in bulk.
 *
 * Dynamically builds an `INSERT INTO ... VALUES` SQL statement, with optional
 * `ON CONFLICT` handling to either ignore duplicates or perform an upsert.
 * Supports returning specific columns (e.g., `id`, `*`, etc.) after execution.
 * Supports multiple update strategies (add, subtract, etc.).
 *
 * @param {string} tableName - Name of the target table.
 * @param {string[]} columns - Array of column names to insert.
 * @param {Array<Array<any>>} rows - 2D array of rows, each matching the column structure.
 * @param {string[]} [conflictColumns=[]] - Columns that define a unique constraint for conflict resolution.
 * @param {Object} [updateStrategies={}] - Map of columns to update strategy.
 * @param {object} clientOrPool - The PostgreSQL client or pool to run the query.
 * @param {Object} [meta={}] - Optional metadata for logging or tracing purposes.
 * @param {string} [returning='RETURNING id'] - Custom RETURNING clause (e.g. `'RETURNING *'`, `'RETURNING id, status_id'`).
 * @returns {Promise<Array<Object>>} - Resolves to inserted or updated rows if `RETURNING` is specified.
 *
 * @throws {AppError} - Throws a wrapped database error on failure.
 *
 * @example
 * // Basic insert with no conflict handling
 * await bulkInsert(
 *   'inventory',
 *   ['product_id', 'location_id', 'quantity'],
 *   [['p1', 'loc-a', 100], ['p2', 'loc-b', 50]],
 *   [],
 *   [],
 *   pool
 * );
 *
 * @example
 * // Insert with DO NOTHING on conflict
 * await bulkInsert(
 *   'inventory',
 *   ['product_id', 'location_id', 'quantity'],
 *   [['p1', 'loc-a', 100]],
 *   ['product_id', 'location_id'],
 *   [],
 *   pool
 * );
 *
 * @example
 * // Insert with DO UPDATE on conflict
 * await bulkInsert(
 *   'inventory',
 *   ['product_id', 'location_id', 'quantity'],
 *   [['p1', 'loc-a', 100]],
 *   ['product_id', 'location_id'],
 *   ['quantity'],
 *   pool,
 *   {},
 *   'RETURNING *'
 * );
 */
const bulkInsert = async (
  tableName,
  columns,
  rows,
  conflictColumns = [],
  updateStrategies = {},
  clientOrPool = pool,
  meta={},
  returning = 'id'
) => {
  if (!rows.length) return 0;

  // Validate that rows are properly structured
  if (
    !Array.isArray(rows) ||
    !rows.every((row) => Array.isArray(row) && row.length === columns.length)
  ) {
    throw AppError.validationError(
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
  const updateCols = Object.keys(updateStrategies);
  
  if (conflictColumns.length > 0) {
    if (updateCols.length > 0) {
      const updateSet = updateCols
        .map((col) => applyUpdateRule(col, updateStrategies[col], tableName))
        .join(', ');
      conflictClause = `ON CONFLICT (${conflictColumns.join(', ')}) DO UPDATE SET ${updateSet}`;
    } else {
      conflictClause = `ON CONFLICT (${conflictColumns.join(', ')}) DO NOTHING`;
    }
  }
  
  const returningClause = returning ? `RETURNING ${returning}` : '';
  
  // Construct SQL query
  const sql = `
    INSERT INTO ${tableName} (${columnNames})
    VALUES ${valuePlaceholders}
    ${conflictClause}
    ${returningClause};
  `;

  // Flatten values for bulk insert
  const flattenedValues = rows.flat();

  try {
    const result = await query(sql, flattenedValues, clientOrPool, 3, 1000, meta);
    return result.rows;
  } catch (error) {
    logBulkInsertError(
      error,
      maskTableName(tableName),
      columns,
      conflictColumns,
      Object.keys(updateStrategies),
      flattenedValues,
      rows.length,
      { ...meta },
    );
    
    throw AppError.databaseError('Bulk insert failed', {
      details: { tableName, columns, conflictColumns, updateStrategies, error: error.message },
    });
  }
};

/**
 * Generates a bulk update SQL query for updating multiple rows in a given table.
 *
 * @param {string} table - The name of the table to update.
 * @param {Array<string>} columns - The columns to be updated (e.g., ['available_quantity', 'reserved_quantity']).
 * @param {Array<string>} whereColumns - The columns used for matching records (e.g., ['warehouse_id', 'inventory_id']).
 * @param {Object} data - An object mapping composite keys to an object of values to update.
 *   - Example:
 *     {
 *       "warehouseId-inventoryId": {
 *         reserved_quantity: 2,
 *         available_quantity: 74
 *       }
 *     }
 * @param {string} userId - The UUID of the user performing the update (used in `updated_by`).
 * @param {Object} columnTypes - (Optional) An object mapping column names to their SQL types.
 *   - Example: { reserved_quantity: 'integer', available_quantity: 'integer', status: 'text' }
 *
 * @returns {Promise<{ baseQuery: string, params: any[] } | null>} The SQL update query and parameters,
 *   or null if `data` is empty.
 *
 * @throws {Error} If query generation fails.
 *
 * @example
 * const { baseQuery, params } = await formatBulkUpdateQuery(
 *   'warehouse_inventory',
 *   ['reserved_quantity', 'available_quantity'],
 *   ['warehouse_id', 'inventory_id'],
 *   {
 *     'wh-id-inv-id': { reserved_quantity: 2, available_quantity: 74 }
 *   },
 *   userId,
 *   {
 *     reserved_quantity: 'integer',
 *     available_quantity: 'integer'
 *   }
 * );
 */
const formatBulkUpdateQuery = (
  table,
  columns, // e.g., ['reserved_quantity', 'status', 'remarks']
  whereColumns, // e.g., ['warehouse_id', 'inventory_id']
  data, // { 'id-id': { reserved_quantity: 5, status: 'active', ... } }
  userId,
  columnTypes = {} // e.g., { reserved_quantity: 'integer', status: 'text' }
) => {
  if (!Object.keys(data).length) return null;

  let indexCounter = 2; // $1 = userId
  const params = [userId]; // initial param list

  const valuesSql = Object.entries(data).map(([key, value]) => {
    const keyParts = key.split(/-(?=[a-f0-9-]{36}$)/); // split composite key like 'warehouseId-inventoryId'
    const rowParams = [
      ...keyParts,
      ...(columns.length === 1 && typeof value !== 'object'
        ? [value]
        : columns.map((col) => value[col] ?? null)),
    ];
    params.push(...rowParams);

    const placeholders = rowParams.map(() => `$${indexCounter++}`);
    const typedPlaceholders = [
      ...keyParts.map(() => `uuid`),
      ...columns.map((col) => columnTypes[col] || 'text'),
    ].map((type, i) => `${placeholders[i]}::${type}`);

    return `(${typedPlaceholders.join(', ')})`;
  });

  const baseQuery = `
    UPDATE ${table}
    SET ${columns.map((col) => `${col} = data.${col}`).join(', ')},
        updated_at = NOW(),
        updated_by = $1
    FROM (VALUES ${valuesSql.join(',\n')})
      AS data(${[...whereColumns, ...columns].join(', ')})
    WHERE ${whereColumns.map((col) => `${table}.${col} = data.${col}`).join(' AND ')}
    RETURNING ${whereColumns.map((col) => `${table}.${col}`).join(', ')};
  `;

  return { baseQuery, params };
};

/**
 * Retrieves a status value from a given table by `code` or `id`.
 *
 * @param {Object} params
 * @param {string} params.table - The table name to search (e.g., 'inventory_allocation_status')
 * @param {Object} params.where - The where clause key-value, e.g., { code: 'ALLOC_COMPLETED' } or { id: 'uuid' }
 * @param {string} params.select - The column to return (e.g., 'id' or 'code')
 * @param {import('pg').PoolClient} [client] - Optional PostgreSQL client for transactional execution.
 * @param {Object} meta={} - Optional additional metadata (e.g., traceId, txId).
 * @returns {Promise<string|null>} - The matched value or null
 * @throws {AppError} - On database or input validation errors
 */
const getStatusValue = async ({ table, where, select }, client, meta={}) => {
  if (!table || typeof where !== 'object' || !select) {
    throw AppError.validationError('Invalid parameters for getStatusValue.');
  }

  const maskedTable = maskTableName(table);
  const whereKey = Object.keys(where)[0];
  const whereValue = where[whereKey];

  const sql = `
    SELECT ${select}
    FROM ${table}
    WHERE ${whereKey} = $1
    LIMIT 1
  `;

  try {
    const result = await query(sql, [whereValue], client);
    return result.rows?.[0]?.[select] || null;
  } catch (error) {
    logGetStatusValueError(
      error,
      sql,
      maskedTable,
      select,
      whereValue,
      whereKey,
      { ...meta },
    );
    
    throw AppError.databaseError(
      `Failed to fetch ${select} from ${maskedTable}: ${error.message}`
    );
  }
};

/**
 * Checks if a row exists in the specified table with the given condition.
 *
 * @param {object} client - pg Client or Pool instance
 * @param {string} table - The table to check
 * @param {object} condition - Key-value pairs for WHERE clause (e.g. { id: 'uuid' })
 * @returns {Promise<boolean>} - True if the row exists, false otherwise
 */
const checkRecordExists = async (client, table, condition) => {
  const keys = Object.keys(condition);
  if (keys.length === 0) throw AppError.validationError('No condition provided');
  
  const whereClause = keys.map((key, i) => `${key} = $${i + 1}`).join(' AND ');
  const values = Object.values(condition);
  
  const sql = `SELECT 1 FROM ${table} WHERE ${whereClause} LIMIT 1`;
  
  try {
    const result = await client.query(sql, values);
    return result.rowCount > 0;
  } catch (error) {
    logSystemException(error, 'Failed to check record existence', {
      context: 'utils/db/checkRecordExists',
      table,
      condition,
    });
    throw AppError.databaseError(`Error checking existence in "${table}"`, {
      details: { condition, error: error.message },
    });
  }
};

// Export the utilities
module.exports = {
  pool,
  retry,
  query,
  getClient,
  withTransaction,
  closePool,
  testConnection,
  monitorPool,
  retryDatabaseConnection,
  paginateQuery,
  paginateQueryByOffset,
  getCountQuery,
  paginateResults,
  lockRow,
  lockRows,
  bulkInsert,
  formatBulkUpdateQuery,
  getStatusValue,
  checkRecordExists,
};
