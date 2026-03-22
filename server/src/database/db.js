/**
 * @file db.js
 * @description
 * Centralized PostgreSQL database layer providing:
 * - connection pooling and lifecycle management
 * - query execution with retry and exponential backoff
 * - transaction orchestration (BEGIN / COMMIT / ROLLBACK)
 * - structured logging and slow query monitoring
 * - standardized error normalization via AppError
 * - SQL safety utilities (allowlist validation + identifier quoting)
 * - pagination, bulk operations, and row locking helpers
 *
 * This module acts as the core database abstraction layer used across
 * repositories and services to enforce consistency, safety, and observability.
 */

const { Pool, Client } = require('pg');
const { loadEnv } = require('../config/env');
const {
  logDbConnect,
  logDbError,
  logDbSlowQuery,
  logDbQueryError,
  logDbTransactionEvent,
  logDbPoolHealth,
  logPaginatedQueryError,
  logBulkInsertError, logLockRowsError, logLockRowError,
} = require('../utils/db-logger');
const { getConnectionConfig, getEnvNumber } = require('../config/db-config');
const AppError = require('../utils/AppError');
const { retry } = require('../utils/retry/retry');
const { maskTableName, maskUUID } = require('../utils/masking/mask-primitives');
const {
  logSystemException,
  logSystemInfo,
  logSystemWarn,
  logSystemDebug,
} = require('../utils/logging/system-logger');
const { generateTraceId } = require('../utils/id-utils');
const {
  assertAllowed,
  qualify,
  q,
} = require('../utils/sql-ident');
const { uniq } = require('../utils/array-utils');
const { handleDbError } = require('../utils/errors/error-handlers');
const { isRetryableDbError } = require('../utils/db/db-error-utils');
const { validateIdentifier } = require('../utils/db/validate-identifier');
const { generateCountQuery, buildPaginatedQuery } = require('./utils/pagination/pagination-builder');
const { executePaginatedQueries } = require('./utils/pagination/pagination-executor');
const { LOCK_MODE_SET } = require('../utils/db/lock-modes');
const { buildWhereClause, buildInClause } = require('../utils/db/where-builder');
const { applyUpdateRule } = require('../utils/db/upsert-utils');


// ------------------------------------------------------------
// Load environment and resolve database connection configuration
// ------------------------------------------------------------
loadEnv();

const connectionConfig = getConnectionConfig();

// ------------------------------------------------------------
// Configure PostgreSQL connection pool
// ------------------------------------------------------------
/**
 * PostgreSQL connection pool (shared singleton).
 *
 * Responsibilities:
 * - Provides a reusable connection pool for all database operations
 * - Manages connection lifecycle and resource allocation
 * - Lifecycle is managed centrally (initialization, monitoring, graceful shutdown)
 * - Supports environment-based configuration for scalability
 * - Enables observability via `application_name`
 *
 * Design considerations:
 * - Pool size is configurable to support different environments
 * - Timeouts prevent resource exhaustion and hanging connections
 * - Shared across query, transaction, and repository layers
 *
 * Tuning guidelines:
 * - max: ≈ (DB max connections / number of services)
 * - idleTimeoutMillis: 30s–60s
 * - connectionTimeoutMillis: 2s–5s
 *
 * @note
 * This module must be the only place where a Pool is instantiated.
 * Creating additional pools can lead to connection exhaustion and degraded performance.
 *
 * @type {import('pg').Pool}
 */
const pool = new Pool({
  ...connectionConfig,
  
  // Maximum number of active clients in the pool
  max: getEnvNumber('DB_POOL_MAX', 10),
  
  // Time (ms) a client can remain idle before being closed
  idleTimeoutMillis: getEnvNumber('DB_IDLE_TIMEOUT', 30000),
  
  // Max time (ms) to wait for a new connection before throwing error
  connectionTimeoutMillis: getEnvNumber('DB_CONN_TIMEOUT', 2000),
  
  // Optional but highly recommended for observability
  application_name:
    `${process.env.DB_APP_NAME || 'wide-erp-api'}:${process.env.NODE_ENV}`,
});

/**
 * Handles unexpected PostgreSQL pool-level errors.
 *
 * These errors are emitted by the pg Pool when an idle client
 * encounters a failure (e.g., network issues, database restart).
 *
 * Important:
 * - This handler must NOT throw (to avoid crashing the process)
 * - Errors are not tied to a specific request context
 * - Used only as an event listener: pool.on('error', ...)
 *
 * @param {Error & { code?: string }} error - Pool error emitted by pg
 */
const handlePoolError = (error) =>
  handleDbError(error, {
    context: 'db/pool',
    message: 'Unexpected database connection error',
    meta: { code: error.code },
    logFn: logDbError,
    suppressThrow: true,
  });

// ------------------------------------------------------------
// Pool event listeners (connection lifecycle & error handling)
// ------------------------------------------------------------

/**
 * Fired whenever a new client is created and connected to PostgreSQL.
 *
 * Used for:
 * - Logging connection events (observability)
 * - Optional session-level configuration (e.g., SET statements)
 *
 * @param {import('pg').PoolClient} client
 */
pool.on('connect', logDbConnect);

/**
 * Fired when an idle client in the pool encounters an error.
 *
 * Important:
 * - These errors are NOT tied to a specific request
 * - Must NEVER throw (will crash Node.js process)
 * - Typically indicates connection instability (network / DB restart)
 *
 * Strategy:
 * - Normalize and log the error via centralized handler
 * - Do NOT propagate or rethrow
 *
 * @param {Error} err
 */
pool.on('error', handlePoolError);

/**
 * Executes a PostgreSQL query with retry, structured logging,
 * and error normalization.
 *
 * Features:
 * - Automatic retry for transient failures (via retry engine)
 * - Slow query monitoring
 * - Structured error normalization (handleDbError)
 * - Supports both pool and transaction clients
 *
 * Important:
 * - Retry is applied only to retryable DB errors
 * - Caller must ensure idempotency for write operations
 *
 * @param {string} text - SQL query string
 * @param {Array<any>} [params=[]] - Query parameters
 * @param {import('pg').PoolClient | null} [client=null] - Optional transaction client
 * @param {Object} [options={}]
 * @param {number} [options.retries=3]
 * @param {number} [options.baseDelay=300]
 * @param {Object} [options.meta={}] - Logging metadata
 *
 * @returns {Promise<import('pg').QueryResult>}
 * @throws {AppError}
 */
const query = async (
  text,
  params = [],
  client = null,
  {
    retries = 3,
    baseDelay = 300,
    meta = {},
  } = {}
) => {
  return retry(
    async () => {
      //--------------------------------------------------
      // Acquire client if not provided (non-transactional)
      //--------------------------------------------------
      const localClient = client || (await pool.connect());
      const shouldRelease = !client;
      
      const startTime = Date.now();
      
      try {
        //--------------------------------------------------
        // Execute query
        //--------------------------------------------------
        const result = await localClient.query(text, params);
        
        //--------------------------------------------------
        // Slow query logging
        //--------------------------------------------------
        const duration = Date.now() - startTime;
        const slowQueryThreshold =
          parseInt(process.env.SLOW_QUERY_THRESHOLD, 10) || 1000;
        
        if (duration > slowQueryThreshold) {
          logDbSlowQuery(text, params, duration, meta);
        }
        
        return result;
      } catch (error) {
        //--------------------------------------------------
        // Normalize + rethrow for retry engine
        //--------------------------------------------------
        throw handleDbError(error, {
          context: 'db/query',
          message: 'Database query failed',
          meta,
          logFn: (err) =>
            logDbQueryError(text, params, err, {
              context: 'db/query',
              ...meta,
            }),
        });
      } finally {
        //--------------------------------------------------
        // Release client if we created it
        //--------------------------------------------------
        if (shouldRelease) {
          localClient.release();
        }
      }
    },
    {
      retries,
      baseDelay,
      shouldRetry: isRetryableDbError,
    }
  );
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
    const message = 'Failed to acquire a database client';
    const context = 'db/getClient/db-client';
    
    throw handleDbError(error, {
      context,
      message,
      logFn: (err) =>
        logSystemException(err, message, {
          context,
          severity: 'critical',
        }),
    });
  }
};

/**
 * Executes a database operation within a transaction.
 *
 * Behavior:
 * - Acquires a client from pool
 * - Begins transaction (with optional isolation level)
 * - Applies optional statement timeout
 * - Executes callback
 * - Commits on success
 * - Rolls back on failure (safe rollback handling)
 * - Always releases client
 *
 * @param {(client: PoolClient, txId: string) => Promise<any>} callback
 * @param {Object} [options={}]
 * @param {string} [options.isolationLevel='READ COMMITTED'] - Transaction isolation level
 * @param {number} [options.timeoutMs=5000] - Statement timeout in milliseconds
 *
 * @returns {Promise<any>}
 * @throws {AppError}
 */
const withTransaction = async (callback, options = {}) => {
  //--------------------------------------------------
  // Validate input
  //--------------------------------------------------
  if (typeof callback !== 'function') {
    throw AppError.validationError('Transaction callback must be a function');
  }
  
  //--------------------------------------------------
  // Resolve options (SAFE DEFAULTS)
  //--------------------------------------------------
  const {
    isolationLevel = 'READ COMMITTED',
    timeoutMs = 5000,
  } = options;
  
  const client = await getClient();
  const txId = generateTraceId();
  
  try {
    //--------------------------------------------------
    // Begin transaction with isolation level
    //--------------------------------------------------
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
    logDbTransactionEvent('BEGIN', txId, { isolationLevel });
    
    //--------------------------------------------------
    // Apply timeout guard (local to this transaction)
    //--------------------------------------------------
    if (timeoutMs > 0) {
      await client.query(`SET LOCAL statement_timeout = ${timeoutMs}`);
    }
    
    //--------------------------------------------------
    // Execute user logic
    //--------------------------------------------------
    const result = await callback(client, txId);
    
    //--------------------------------------------------
    // Commit
    //--------------------------------------------------
    await client.query('COMMIT');
    logDbTransactionEvent('COMMIT', txId);
    
    return result;
  } catch (error) {
    //--------------------------------------------------
    // Safe rollback
    //--------------------------------------------------
    try {
      await client.query('ROLLBACK');
      logDbTransactionEvent('ROLLBACK', txId, { severity: 'critical' });
    } catch (rollbackError) {
      logSystemException(rollbackError, 'Rollback failed', {
        txId,
        context: 'db/withTransaction/rollback',
        severity: 'critical',
      });
    }
    
    //--------------------------------------------------
    // Handle error
    //--------------------------------------------------
    const message = 'Transaction failed';
    const context = 'db/withTransaction';
    
    throw handleDbError(error, {
      context,
      message,
      meta: { txId, isolationLevel },
      logFn: (err) =>
        logSystemException(err, message, {
          txId,
          context,
          isolationLevel,
          severity: 'critical',
        }),
    });
  } finally {
    //--------------------------------------------------
    // Always release client
    //--------------------------------------------------
    client.release();
  }
};

/**
 * Performs a basic database connectivity test.
 *
 * Executes a lightweight query to confirm the database is reachable.
 * Uses a short timeout to avoid hanging in case of network or DB issues.
 *
 * @returns {Promise<boolean>} Returns true if connection is healthy
 *
 * @throws {AppError} If the connectivity test fails
 */
const testConnection = async () => {
  const context = 'db/testConnection/healthcheck';
  
  try {
    //--------------------------------------------------
    // Use direct query with timeout guard
    //--------------------------------------------------
    await query('SELECT 1', [], null, {
      retries: 0,
      baseDelay: 0,
      meta: { context },
    });
    
    logSystemInfo('Database connection is healthy.', { context });
    
    return true;
  } catch (error) {
    const message = 'Database connection test failed';
    
    throw handleDbError(error, {
      context,
      message,
      logFn: (err) =>
        logSystemException(err, message, {
          context,
          severity: 'critical',
        }),
    });
  }
};

/**
 * @typedef {Object} PgPoolMetrics
 * @property {number} totalCount
 * @property {number} idleCount
 * @property {number} waitingCount
 */

/**
 * @typedef {import('pg').Pool & PgPoolMetrics} PgPoolWithMetrics
 */

/**
 * Retrieves and logs PostgreSQL pool metrics.
 *
 * Provides insight into:
 * - total active clients
 * - idle clients
 * - queued (waiting) requests
 *
 * Useful for monitoring connection pool health and diagnosing bottlenecks.
 *
 * @returns {{
 *   totalClients: number,
 *   idleClients: number,
 *   waitingRequests: number,
 *   isHealthy: boolean
 * }}
 */
const monitorPool = () => {
  /** @type {PgPoolWithMetrics} */
  const typedPool = pool;
  
  //--------------------------------------------------
  // Collect metrics
  //--------------------------------------------------
  const totalClients = typedPool.totalCount;
  const idleClients = typedPool.idleCount;
  const waitingRequests = typedPool.waitingCount;
  
  //--------------------------------------------------
  // Basic health evaluation
  //--------------------------------------------------
  const isHealthy = waitingRequests === 0;
  
  const metrics = {
    totalClients,
    idleClients,
    waitingRequests,
    isHealthy,
  };
  
  //--------------------------------------------------
  // Log only if unhealthy or periodically
  //--------------------------------------------------
  if (!isHealthy) {
    logDbPoolHealth(metrics, { severity: 'warning' });
  }
  
  return metrics;
};

let poolClosed = false;
let closingPromise = null;

/**
 * Gracefully shuts down the PostgreSQL connection pool.
 *
 * Ensures:
 * - Idempotent behavior (safe to call multiple times)
 * - Only one close operation executes
 * - Concurrent calls wait for the same shutdown
 *
 * Notes:
 * - Does NOT throw on shutdown failure (logs instead)
 * - Intended for process shutdown (SIGINT, SIGTERM)
 *
 * @returns {Promise<void>}
 */
const closePool = async () => {
  const context = 'db/closePool/shutdown';
  
  //--------------------------------------------------
  // Already closed → no-op
  //--------------------------------------------------
  if (poolClosed) {
    logSystemWarn('Pool already closed.', { context });
    return;
  }
  
  //--------------------------------------------------
  // Closing in progress → reuse promise
  //--------------------------------------------------
  if (closingPromise) {
    return closingPromise;
  }
  
  //--------------------------------------------------
  // Start closing
  //--------------------------------------------------
  closingPromise = (async () => {
    logSystemInfo('Closing database connection pool...', { context });
    
    try {
      await pool.end();
      
      poolClosed = true;
      
      logSystemInfo('Database connection pool closed.', { context });
    } catch (error) {
      logSystemException(error, 'Error closing database connection pool', {
        context,
        severity: 'critical',
      });
      
      // Do NOT rethrow (shutdown-safe)
    }
  })();
  
  return closingPromise;
};

/**
 * Retries database connectivity using a temporary client.
 *
 * Intended for startup/readiness checks.
 *
 * Features:
 * - Exponential backoff with jitter
 * - Per-attempt timeout (prevents hanging)
 * - Structured logging
 *
 * @param {Object} config - PostgreSQL connection config
 * @param {Object} [options]
 * @param {number} [options.retries=5] - Max attempts
 * @param {number} [options.baseDelayMs=500] - Base delay for backoff
 * @param {number} [options.maxDelayMs=5000] - Max delay cap
 * @param {number} [options.connectTimeoutMs=3000] - Timeout per attempt
 *
 * @returns {Promise<void>}
 * @throws {AppError} If all attempts fail
 */
const retryDatabaseConnection = async (
  config,
  {
    retries = 5,
    baseDelayMs = 500,
    maxDelayMs = 5000,
    connectTimeoutMs = 3000,
  } = {}
) => {
  const context = 'db/retryDatabaseConnection';
  
  //--------------------------------------------------
  // Helper: delay
  //--------------------------------------------------
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  
  //--------------------------------------------------
  // Helper: exponential backoff + jitter
  //--------------------------------------------------
  const computeDelay = (attempt) => {
    const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
    const jitter = Math.floor(Math.random() * 200);
    return exp + jitter;
  };
  
  //--------------------------------------------------
  // Retry loop
  //--------------------------------------------------
  for (let attempt = 1; attempt <= retries; attempt++) {
    const client = new Client({
      ...config,
      connectionTimeoutMillis: connectTimeoutMs,
    });
    
    try {
      //--------------------------------------------------
      // Attempt connection
      //--------------------------------------------------
      await client.connect();
      
      logSystemInfo('Database connected successfully', {
        context,
        attempt,
        retries,
      });
      
      await client.end();
      return;
    } catch (error) {
      await client.end().catch(() => {});
      
      logSystemWarn('Database connection attempt failed', {
        context,
        attempt,
        retries,
        errorMessage: error.message,
      });
      
      //--------------------------------------------------
      // Final failure
      //--------------------------------------------------
      if (attempt === retries) {
        const message = 'Database connection failed after retries';
        
        throw handleDbError(error, {
          context,
          message,
          meta: { attempts: attempt, retries },
          logFn: (err) =>
            logSystemException(err, message, {
              context,
              attempts: attempt,
              retries,
              severity: 'critical',
            }),
        });
      }
      
      //--------------------------------------------------
      // Backoff before next attempt
      //--------------------------------------------------
      const delayMs = computeDelay(attempt);
      await sleep(delayMs);
    }
  }
};

/**
 * Executes a paginated query with consistent COUNT and data retrieval.
 *
 * SECURITY:
 * - All SQL fragments (queryText, joins, whereClause, sortBy) MUST be
 *   pre-built and validated internally (DO NOT pass raw user input).
 *
 * Behavior:
 * - Executes COUNT query and paginated data query
 * - Ensures consistent filtering between queries
 * - Applies safe LIMIT/OFFSET parameterization
 * - Supports transaction or pool execution
 *
 * @param {Object} options
 * @param {string} options.queryText - Full base query (without ORDER BY / LIMIT / OFFSET)
 * @param {string} options.tableName - Main table (for COUNT query)
 * @param {string[]} [options.joins=[]] - JOIN clauses (must match queryText)
 * @param {string} [options.whereClause='1=1'] - WHERE clause (must match queryText)
 * @param {any[]} [options.params=[]] - Query parameters
 * @param {number} [options.page=1]
 * @param {number} [options.limit=10]
 * @param {string} [options.sortBy] - Validated column name
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']
 * @param {import('pg').Pool|import('pg').PoolClient} [options.clientOrPool]
 * @param {Object} [options.meta={}]
 *
 * @returns {Promise<{ data: any[], pagination: { page: number, limit: number, totalRecords: number, totalPages: number } }>}
 */
const paginateQuery = async ({
                               queryText,
                               tableName,
                               joins = [],
                               whereClause = '1=1',
                               params = [],
                               page = 1,
                               limit = 10,
                               sortBy,
                               sortOrder = 'ASC',
                               clientOrPool = pool,
                               meta = {},
                             }) => {
  const context = 'db/paginateQuery';
  
  //--------------------------------------------------
  // Validate inputs
  //--------------------------------------------------
  if (page < 1 || limit < 1) {
    throw AppError.validationError('Page and limit must be positive integers.');
  }
  
  const MAX_LIMIT = 100;
  if (limit > MAX_LIMIT) {
    throw AppError.validationError(`Limit cannot exceed ${MAX_LIMIT}`);
  }
  
  if (!queryText || typeof queryText !== 'string') {
    throw AppError.validationError('Invalid queryText');
  }
  
  //--------------------------------------------------
  // Pagination calculation
  //--------------------------------------------------
  const offset = (page - 1) * limit;
  
  //--------------------------------------------------
  // Build queries
  //--------------------------------------------------
  const countQueryText = generateCountQuery(
    tableName,
    joins,
    whereClause
  );
  
  const paginatedQuery = buildPaginatedQuery({
    baseQuery: queryText,
    sortBy: sortBy || 'id', // enforce deterministic sort
    sortOrder,
    paramIndex: params.length,
  });
  
  const queryParams = [...params, limit, offset];
  
  try {
    //--------------------------------------------------
    // Execute queries via shared helper
    //--------------------------------------------------
    const { rows, totalRecords } = await executePaginatedQueries({
      dataQuery: paginatedQuery,
      dataParams: queryParams,
      countQuery: countQueryText,
      countParams: params,
      clientOrPool,
    });
    
    //--------------------------------------------------
    // Build pagination response
    //--------------------------------------------------
    const totalPages = Math.ceil(totalRecords / limit);
    
    return {
      data: rows,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
      },
    };
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to execute paginated query.',
      meta: { page, limit, ...meta },
      logFn: (err) =>
        logPaginatedQueryError(
          err,
          paginatedQuery,
          countQueryText,
          queryParams,
          { page, limit, ...meta }
        ),
    });
  }
};

/**
 * Executes a paginated SQL query using offset-based pagination.
 *
 * SECURITY:
 * - All SQL fragments (queryText, joins, whereClause, sortBy, additionalSort)
 *   MUST be pre-built and validated internally (DO NOT pass raw user input).
 *
 * CONSISTENCY:
 * - `queryText`, `tableName`, `joins`, and `whereClause` MUST represent
 *   the same logical query to ensure accurate pagination.
 *
 * Behavior:
 * - Executes COUNT and data query
 * - Supports DISTINCT counting to avoid JOIN duplication
 * - Applies safe LIMIT/OFFSET parameterization
 * - Handles pool vs transaction client safely
 *
 * @param {Object} options
 * @param {string} options.tableName
 * @param {string[]} [options.joins=[]]
 * @param {string} [options.whereClause='1=1']
 * @param {string} options.queryText
 * @param {any[]} [options.params=[]]
 * @param {number} [options.offset=0]
 * @param {number} [options.limit=10]
 * @param {string|null} [options.sortBy]
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']
 * @param {string|null} [options.additionalSort]
 * @param {import('pg').Pool|import('pg').PoolClient} [options.clientOrPool]
 * @param {Object} [options.meta={}]
 * @param {boolean} [options.useDistinct=false]
 * @param {string} [options.distinctColumn]
 *
 * @returns {Promise<{ data: any[], pagination: { offset: number, limit: number, totalRecords: number, hasMore: boolean } }>}
 */
const paginateQueryByOffset = async ({
                                       tableName,
                                       joins = [],
                                       whereClause = '1=1',
                                       queryText,
                                       params = [],
                                       offset = 0,
                                       limit = 10,
                                       sortBy,
                                       sortOrder = 'ASC',
                                       additionalSort,
                                       clientOrPool = pool,
                                       meta = {},
                                       useDistinct = false,
                                       distinctColumn,
                                     }) => {
  const context = 'db/paginateQueryByOffset';
  
  //--------------------------------------------------
  // Validate inputs
  //--------------------------------------------------
  if (offset < 0 || limit < 1) {
    throw AppError.validationError(
      'Offset must be >= 0 and limit must be a positive integer.'
    );
  }
  
  const MAX_LIMIT = 100;
  if (limit > MAX_LIMIT) {
    throw AppError.validationError(`Limit cannot exceed ${MAX_LIMIT}`);
  }
  
  if (!queryText || typeof queryText !== 'string') {
    throw AppError.validationError('Invalid queryText');
  }
  
  if (useDistinct && !distinctColumn) {
    throw AppError.validationError(
      'distinctColumn must be provided when useDistinct is true.'
    );
  }
  
  //--------------------------------------------------
  // Build queries
  //--------------------------------------------------
  const countQueryText = generateCountQuery(
    tableName,
    joins,
    whereClause,
    useDistinct,
    distinctColumn
  );
  
  const paginatedQuery = buildPaginatedQuery({
    baseQuery: queryText,
    sortBy: sortBy || 'id', // enforce deterministic order
    sortOrder,
    additionalSort,
    paramIndex: params.length,
  });
  
  const queryParams = [...params, limit, offset];
  
  //--------------------------------------------------
  // Execute queries (safe for client vs pool)
  //--------------------------------------------------
  try {
    const isClient =
      typeof clientOrPool?.query === 'function' &&
      typeof clientOrPool?.release === 'function';
    
    let dataResult;
    let countResult;
    
    if (isClient) {
      // sequential (transaction-safe)
      dataResult = await query(paginatedQuery, queryParams, clientOrPool);
      countResult = await query(countQueryText, params, clientOrPool);
    } else {
      // parallel (pool-safe)
      [dataResult, countResult] = await Promise.all([
        query(paginatedQuery, queryParams, clientOrPool),
        query(countQueryText, params, clientOrPool),
      ]);
    }
    
    //--------------------------------------------------
    // Validate count result
    //--------------------------------------------------
    if (!countResult.rows.length) {
      throw AppError.databaseError('Failed to fetch total record count.');
    }
    
    const totalRecords = Number(countResult.rows[0].total) || 0;
    
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
    throw handleDbError(error, {
      context,
      message: 'Failed to execute offset-based paginated query.',
      meta: {
        offset,
        limit,
        useDistinct,
        distinctColumn,
        ...meta,
      },
      logFn: (err) =>
        logPaginatedQueryError(
          err,
          paginatedQuery,
          countQueryText,
          queryParams,
          {
            offset,
            limit,
            useDistinct,
            distinctColumn,
            ...meta,
          }
        ),
    });
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
      context: 'db/getCountQuery/query-builder',
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
    
    /** @typedef {{ total_count: string | number }} CountRow */
    
    /** @type {CountRow[]} */
    const countRows = countResult.rows;
    
    const totalRecords = Number(countRows[0]?.total_count ?? 0);
    const totalPages = Math.ceil(totalRecords / limit);

    return {
      data: dataRows.rows || [],
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
      },
    };
  } catch (error) {
    throw handleDbError(error, {
      context: 'db/paginateResults',
      message: 'Failed to execute paginated results query.',
      meta: {
        page,
        limit,
      },
      logFn: (err) =>
        logPaginatedQueryError(err, dataQuery, countQuery, params, {
          page,
          limit,
          ...meta,
        }),
    });
  }
};

/**
 * Lock a single row by primary key.
 *
 * Executes a SELECT ... FOR <LOCK_MODE> query to acquire a row-level lock
 * within an active transaction.
 *
 * Design Notes:
 * - Must be called inside a transaction
 * - Uses parameterized query (SQL injection safe)
 * - Assumes standardized primary key (`id`)
 * - Guarantees exactly one row or throws
 *
 * Performance:
 * - Single query (no schema lookup)
 * - Index-based lookup on PK
 *
 * @param {object} client - Active DB transaction client
 * @param {string} table - Table name (validated upstream)
 * @param {string} id - Primary key value
 * @param {string} [lockMode='FOR UPDATE'] - PostgreSQL lock mode
 * @param {object} [meta={}] - Additional logging metadata
 *
 * @returns {Promise<object>} Locked row
 *
 * @throws {AppError}
 */
const lockRow = async (
  client,
  table,
  id,
  lockMode = 'FOR UPDATE',
  meta = {}
) => {
  const context = 'db/lockRow';
  const maskedId = maskUUID(id);
  const maskedTable = maskTableName(table);
  
  //--------------------------------------------------
  // 1. Validate input
  //--------------------------------------------------
  if (!id || typeof id !== 'string') {
    throw AppError.validationError('Invalid id', { context });
  }
  
  if (!LOCK_MODE_SET.has(lockMode)) {
    throw AppError.validationError(`Invalid lock mode: ${lockMode}`, {
      context,
    });
  }
  
  //--------------------------------------------------
  // 2. Build SQL (standard PK = id)
  //--------------------------------------------------
  const sql = `
    SELECT *
    FROM ${qualify('public', table)}
    WHERE ${q('id')} = $1
    ${lockMode}
  `;
  
  //--------------------------------------------------
  // 3. Execute
  //--------------------------------------------------
  try {
    const { rows } = await query(sql, [id], client);
    
    //--------------------------------------------------
    // Not found → explicit domain error
    //--------------------------------------------------
    if (!rows.length) {
      throw AppError.notFoundError(
        `Row "${maskedId}" not found in "${maskedTable}"`
      );
    }
    
    return rows[0];
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: `Failed to lock row in "${maskedTable}"`,
      meta: { table: maskedTable, id: maskedId, ...meta },
      logFn: (err) =>
        logLockRowError(err, sql, [id], maskedTable, lockMode, meta),
    });
  }
};

/**
 * Lock multiple rows using primary key values or composite conditions.
 *
 * Executes a SELECT ... FOR <LOCK_MODE> query to acquire row-level locks
 * within an active transaction.
 *
 * Supports:
 * - Array of primitive values → WHERE id IN (...)
 * - Array of objects → WHERE (a=1 AND b=2) OR (...)
 *
 * Design Notes:
 * - Must be called inside a transaction
 * - Uses parameterized queries (SQL injection safe)
 * - Assumes standardized primary key (`id`)
 * - Delegates SQL building to pure helpers
 * - Logs partial matches for primitive mode only
 *
 * Performance:
 * - IN (...) is index-optimized (fast path)
 * - Composite OR conditions degrade with size → batch if > 50–100
 *
 * @param {object} client - Active DB transaction client
 * @param {string} table - Table name (validated upstream)
 * @param {Array<string|object>} conditions - IDs or condition objects
 * @param {string} [lockMode='FOR UPDATE'] - PostgreSQL lock mode
 * @param {object} [meta={}] - Additional logging metadata
 *
 * @returns {Promise<object[]>} Locked rows
 *
 * @throws {AppError}
 */
const lockRows = async (
  client,
  table,
  conditions,
  lockMode = 'FOR UPDATE',
  meta = {}
) => {
  const context = 'db/lockRows';
  const maskedTable = maskTableName(table);
  
  //--------------------------------------------------
  // 1. Validate input
  //--------------------------------------------------
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw AppError.validationError('Invalid conditions', { context });
  }
  
  if (!LOCK_MODE_SET.has(lockMode)) {
    throw AppError.validationError(`Invalid lock mode: ${lockMode}`, {
      context,
    });
  }
  
  //--------------------------------------------------
  // 2. Determine condition type safely
  //--------------------------------------------------
  const isPrimitiveList =
    typeof conditions[0] !== 'object' || conditions[0] === null;
  
  //--------------------------------------------------
  // 3. Normalize / validate values
  //--------------------------------------------------
  const sanitizedConditions = conditions.filter(
    (v) => v !== null && v !== undefined
  );
  
  if (sanitizedConditions.length === 0) {
    throw AppError.validationError('Empty conditions after sanitization', {
      context,
    });
  }
  
  //--------------------------------------------------
  // 4. Build WHERE clause
  //--------------------------------------------------
  const { clause, values } = isPrimitiveList
    ? buildInClause('id', sanitizedConditions)
    : buildWhereClause(sanitizedConditions);
  
  //--------------------------------------------------
  // 5. Build SQL
  //--------------------------------------------------
  const sql = `
    SELECT *
    FROM ${qualify('public', table)}
    WHERE ${clause}
    ${lockMode}
  `;
  
  //--------------------------------------------------
  // 6. Execute
  //--------------------------------------------------
  try {
    const { rows } = await query(sql, values, client);
    
    //--------------------------------------------------
    // Partial match warning (ONLY for PK mode)
    //--------------------------------------------------
    if (isPrimitiveList && rows.length !== sanitizedConditions.length) {
      logSystemWarn('Partial row lock result', {
        context: `${context}/partial`,
        expected: sanitizedConditions.length,
        found: rows.length,
        table: maskedTable,
      });
    }
    
    //--------------------------------------------------
    // Performance warning (composite heavy queries)
    //--------------------------------------------------
    if (!isPrimitiveList && conditions.length > 50) {
      logSystemWarn('Potential slow composite lock query', {
        context: `${context}/performance`,
        count: conditions.length,
        table: maskedTable,
      });
    }
    
    return rows;
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: `Failed to lock rows in "${maskedTable}"`,
      meta: { table: maskedTable, count: conditions.length, ...meta },
      logFn: (err) =>
        logLockRowsError(err, sql, values, maskedTable, meta),
    });
  }
};

const MAX_PARAMS = 60000;

/**
 * Inserts multiple rows into a database table using a bulk UPSERT pattern.
 *
 * Features:
 * - Efficient multi-row INSERT
 * - ON CONFLICT DO UPDATE with strategy-based updates
 * - Supports computed updates via `extraUpdates`
 * - Retry + structured logging support
 *
 * Update strategies:
 * - add, subtract, max, min, coalesce
 * - merge_jsonb, merge_text
 * - overwrite, keep
 *
 * @param {string} tableName
 * @param {string[]} columns
 * @param {Array<Array<any>>} rows
 * @param {string[]} [conflictColumns=[]]
 * @param {Object<string,string>} [updateStrategies={}]
 * @param {import('pg').PoolClient|null} [client=null]
 * @param {object} [options]
 * @param {object} [options.meta]
 * @param {string[]} [options.extraUpdates]
 * @param {string|null} [returning='id']
 *
 * @returns {Promise<object[]>}
 * @throws {AppError}
 */
const bulkInsert = async (
  tableName,
  columns,
  rows,
  conflictColumns = [],
  updateStrategies = {},
  client = null,
  options = {},
  returning = 'id'
) => {
  const { meta = {}, extraUpdates = [] } = options;
  
  //--------------------------------------------------
  // Validate input
  //--------------------------------------------------
  if (!Array.isArray(rows) || rows.length === 0) return [];
  
  if (!rows.every((r) => Array.isArray(r) && r.length === columns.length)) {
    throw AppError.validationError(
      `Invalid rows: expected ${columns.length} columns`
    );
  }
  
  //--------------------------------------------------
  // Parameter limit protection
  //--------------------------------------------------
  const totalParams = rows.length * columns.length;
  
  if (totalParams >= MAX_PARAMS) {
    throw AppError.validationError(
      'Batch too large, split into smaller chunks'
    );
  }
  
  //--------------------------------------------------
  // Validate identifiers
  //--------------------------------------------------
  const safeTable = validateIdentifier(tableName, 'table');
  const safeColumns = columns.map((c) => validateIdentifier(c, 'column'));
  const safeConflictColumns = conflictColumns.map((c) =>
    validateIdentifier(c, 'conflict column')
  );
  const safeUpdateColumns = Object.keys(updateStrategies).map((c) =>
    validateIdentifier(c, 'update column')
  );
  
  //--------------------------------------------------
  // Build VALUES
  //--------------------------------------------------
  const columnNames = safeColumns.join(', ');
  
  const valuePlaceholders = rows
    .map(
      (_, i) =>
        `(${safeColumns
          .map((_, j) => `$${i * safeColumns.length + j + 1}`)
          .join(', ')})`
    )
    .join(', ');
  
  //--------------------------------------------------
  // Conflict handling
  //--------------------------------------------------
  let conflictClause = '';
  
  if (safeConflictColumns.length > 0) {
    const tableAlias = 't';
    
    const updateSet = safeUpdateColumns
      .map((col) =>
        applyUpdateRule(col, updateStrategies[col], tableAlias)
      )
      .filter(Boolean);
    
    //--------------------------------------------------
    // Append extra updates (derived fields)
    //--------------------------------------------------
    if (!Array.isArray(extraUpdates)) {
      throw AppError.validationError('extraUpdates must be array');
    }
    
    if (extraUpdates.length > 0) {
      updateSet.push(...extraUpdates);
    }
    
    conflictClause =
      updateSet.length > 0
        ? `ON CONFLICT (${safeConflictColumns.join(', ')}) DO UPDATE SET ${updateSet.join(', ')}`
        : `ON CONFLICT (${safeConflictColumns.join(', ')}) DO NOTHING`;
  }
  
  //--------------------------------------------------
  // Returning
  //--------------------------------------------------
  const returningClause = returning ? `RETURNING ${returning}` : '';
  
  //--------------------------------------------------
  // Final SQL
  //--------------------------------------------------
  const sql = `
    INSERT INTO ${safeTable} AS t (${columnNames})
    VALUES ${valuePlaceholders}
    ${conflictClause}
    ${returningClause};
  `;
  
  const values = rows.flat();
  
  //--------------------------------------------------
  // Execute
  //--------------------------------------------------
  try {
    const result = await query(sql, values, client, {
      retries: 3,
      baseDelay: 300,
      meta,
    });
    
    return result.rows;
  } catch (error) {
    const maskedTable = maskTableName(safeTable);
    
    throw handleDbError(error, {
      context: 'db/bulkInsert',
      message: 'Bulk insert failed',
      meta: {
        table: maskedTable,
        rowCount: rows.length,
      },
      logFn: (err) =>
        logBulkInsertError(err, maskedTable, values, rows.length, {
          columns: safeColumns,
          conflictColumns: safeConflictColumns,
          updateStrategies: safeUpdateColumns,
          extraUpdates,
          ...meta,
        }),
    });
  }
};

/**
 * Updates a single record by primary key with validation, audit handling,
 * and structured error management.
 *
 * Designed for repository-layer usage with strict safety guarantees:
 * - prevents updates to protected/system fields
 * - enforces allowed schema/table access
 * - supports automatic audit metadata injection
 * - builds fully parameterized SQL (no injection risk)
 *
 * @param {string} table - Target table name
 * @param {string} id - Primary key UUID
 * @param {Object} updates - Fields to update
 * @param {string|null} userId - User performing the update
 * @param {import('pg').PoolClient} client - DB client or transaction
 * @param {Object} [options]
 * @param {string} [options.schema='public']
 * @param {string} [options.updatedAtField='updated_at']
 * @param {string} [options.updatedByField='updated_by']
 * @param {string} [options.idField='id'] - Primary key column name
 * @param {Set<string>} [options.allowedFields] - Optional whitelist
 *
 * @returns {Promise<{ id: string }>}
 *
 * @throws {AppError}
 * - ValidationError
 * - NotFoundError
 * - DatabaseError
 */
const updateById = async (
  table,
  id,
  updates = {},
  userId,
  client,
  options = {}
) => {
  const context = 'db/updateById';
  
  const {
    schema = 'public',
    updatedAtField = 'updated_at',
    updatedByField = 'updated_by',
    idField = 'id',
    allowedFields = null,
  } = options;
  
  const maskedTable = maskTableName(table);
  
  //------------------------------------------------------------
  // 1. Validate inputs
  //------------------------------------------------------------
  if (!id || typeof id !== 'string' || !table || typeof table !== 'string') {
    throw AppError.validationError('Invalid update request.', { context });
  }
  
  if (!updates || typeof updates !== 'object') {
    throw AppError.validationError('Updates must be an object.', { context });
  }
  
  //------------------------------------------------------------
  // 2. Access control (table-level)
  //------------------------------------------------------------
  assertAllowed(schema, table);
  
  //------------------------------------------------------------
  // 3. Normalize update payload (IMMUTABLE)
  //------------------------------------------------------------
  const PROTECTED_FIELDS = new Set(['id', 'created_at', 'created_by']);
  
  const updateData = Object.entries(updates).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    
    if (PROTECTED_FIELDS.has(key)) {
      throw AppError.validationError('Invalid update field.', {
        context,
        field: key,
      });
    }
    
    if (allowedFields && !allowedFields.has(key)) {
      throw AppError.validationError('Field not allowed.', {
        context,
        field: key,
      });
    }
    
    acc[key] = value;
    return acc;
  }, {});
  
  //------------------------------------------------------------
  // 4. Inject audit metadata
  //------------------------------------------------------------
  if (userId && updatedByField) {
    updateData[updatedByField] = userId;
  }
  
  const fields = Object.keys(updateData);
  
  //------------------------------------------------------------
  // 5. Prevent empty updates (strict)
  //------------------------------------------------------------
  if (fields.length === 0) {
    throw AppError.validationError('No valid fields provided to update.', {
      context,
    });
  }
  
  //------------------------------------------------------------
  // 6. Build SET clause
  //------------------------------------------------------------
  const setClauses = fields.map(
    (field, idx) => `${q(field)} = $${idx + 2}`
  );
  
  if (updatedAtField) {
    setClauses.push(`${q(updatedAtField)} = NOW()`);
  }
  
  const values = [id, ...fields.map((f) => updateData[f])];
  
  //------------------------------------------------------------
  // 7. Execute
  //------------------------------------------------------------
  const sql = `
    UPDATE ${qualify(schema, table)}
    SET ${setClauses.join(', ')}
    WHERE ${q(idField)} = $1
    RETURNING ${q(idField)}
  `;
  
  try {
    const result = await query(sql, values, client);
    
    if (result.rowCount === 0) {
      throw AppError.notFoundError('Record not found.', { context });
    }
    
    return result.rows[0];
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: `Failed to update ${maskedTable} record.`,
      meta: {
        schema,
        table: maskedTable,
        id,
        fields,
      },
      logFn: (err) =>
        logSystemException(err, 'Update failed', {
          context,
          schema,
          table: maskedTable,
          id,
          fields,
        }),
    });
  }
};

/**
 * Retrieves a unique scalar value from a specified table based on a given condition.
 *
 * This function executes an SQL `SELECT` query using the provided table name, `where` condition,
 * and the scalar field to retrieve. It enforces that only one row should match the condition,
 * and throws an error if multiple rows are found. If no row is found, it returns `null`.
 *
 * @param {Object} params - The query parameters.
 * @param {string} params.table - The name of the table to query.
 * @param {Object} params.where - An object containing a single key-value pair for the WHERE clause.
 * @param {string} params.select - The field name to select and return from the matched row.
 * @param {Object} [client] - Optional database client instance (e.g., for transactions).
 * @param {Object} [meta={}] - Optional metadata for logging purposes.
 *
 * @returns {Promise<any|null>} - The scalar value if found, `null` if no match is found.
 *
 * @throws {AppError} - Throws validation error if inputs are invalid,
 *                      or database error if the query fails or returns multiple rows.
 *
 * @example
 * const value = await getUniqueScalarValue({
 *   table: 'users',
 *   where: { email: 'test@example.com' },
 *   select: 'id'
 * });
 * // value might be '123e4567-e89b-12d3-a456-426614174000'
 */
const getUniqueScalarValue = async (
  { table, where, select },
  client,
  meta = {}
) => {
  if (!table || typeof where !== 'object' || !select) {
    throw AppError.validationError(
      'Invalid parameters for getScalarFieldValue.'
    );
  }

  const maskedTable = maskTableName(table);
  const whereKey = Object.keys(where ?? {})[0] ?? 'id';
  const whereValue = where[whereKey];

  const sql = `
    SELECT ${select}
    FROM ${table}
    WHERE ${whereKey} = $1
    LIMIT 1
  `;

  try {
    const result = await query(sql, [whereValue], client);
    if (result.rows.length === 0) return null;
    if (result.rows.length > 1) {
      throw AppError.databaseError(
        `Multiple rows found in "${maskedTable}" for ${whereKey} = ${whereValue}`
      );
    }
    return result.rows[0][select];
  } catch (error) {
    throw handleDbError(error, {
      context: 'db/getUniqueScalarValue',
      message: `Failed to fetch value '${select}' from '${maskedTable}'.`,
      meta: {
        table: maskedTable,
        select,
        whereKey,
      },
      logFn: (err) =>
        logDbQueryError(sql, [whereValue], err, {
          context: 'get-unique-scalar-value',
          table: maskedTable,
          select,
          where: { [whereKey]: whereValue },
          ...meta,
        }),
    });
  }
};

/**
 * Safely checks if a record exists in the specified table with the given condition.
 *
 * Supports `null` values by automatically converting them to `IS NULL` in the WHERE clause.
 *
 * Example:
 *   checkRecordExists('addresses', { customer_id: null }) → WHERE customer_id IS NULL
 *
 * @param {string} table - The name of the table (validated to prevent SQL injection).
 * @param {object} condition - Key-value pairs for the WHERE clause.
 *                             Null values will be translated to `IS NULL`.
 *                             (e.g., { id: 'uuid' }, { customer_id: null })
 * @param {PoolClient} [client] - Optional PostgreSQL client or transaction context.
 * @returns {Promise<boolean>} - Resolves to true if a matching record exists, false otherwise.
 */
const checkRecordExists = async (table, condition, client = null) => {
  if (!table || typeof table !== 'string') {
    throw AppError.validationError('Invalid table name');
  }

  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(table)) {
    throw AppError.validationError('Unsafe table name');
  }

  const keys = Object.keys(condition);
  if (keys.length === 0) {
    throw AppError.validationError('No condition provided');
  }

  const whereClause = keys
    .map((key, idx) =>
      condition[key] === null ? `${key} IS NULL` : `${key} = $${idx + 1}`
    )
    .join(' AND ');

  const values = Object.values(condition).filter((v) => v !== null);
  const sql = `SELECT EXISTS (SELECT 1 FROM ${table} WHERE ${whereClause}) AS exists;`;

  try {
    const { rows } = await query(sql, values, client);
    return rows.length > 0 && rows[0].exists === true;
  } catch (error) {
    const maskedTable = maskTableName(table);
    
    throw handleDbError(error, {
      context: 'db/checkRecordExists',
      message: `Failed to check existence in "${maskedTable}"`,
      meta: {
        maskedTable,
        condition,
      },
      logFn: (err) =>
        logSystemException(err, 'Failed to check record existence', {
          context: 'db/checkRecordExists',
          maskedTable,
          condition,
        }),
    });
  }
};

/**
 * Return IDs from `ids` that are NOT present in `${schema}.${table}.${idColumn}`.
 *
 * - One round-trip (UNNEST), parameterized values.
 * - Uses allowlist + quoted identifiers to prevent SQL injection on identifiers.
 *
 * @param {import('pg').PoolClient} client
 * @param {string} table
 * @param {string[]} ids
 * @param {{ schema?: string|null, idColumn?: string, logOnError?: boolean }} [opts]
 * @returns {Promise<string[]>} missing IDs
 */
const findMissingIds = async (client, table, ids, opts = {}) => {
  const context = 'db/findMissingIds';
  
  const {
    schema = 'public',
    idColumn = 'id',
    logOnError = true,
  } = opts;
  
  //--------------------------------------------------
  // 1. Normalize input
  //--------------------------------------------------
  const list = uniq(ids);
  if (list.length === 0) return [];
  
  const maskedTable = maskTableName(table);
  
  //--------------------------------------------------
  // 2. Build SAFE SQL
  //--------------------------------------------------
  const sql = `
    WITH input(id) AS (
      SELECT DISTINCT UNNEST($1::uuid[])
    )
    SELECT i.id
    FROM input i
    WHERE NOT EXISTS (
      SELECT 1
      FROM ${qualify(schema, table)} t
      WHERE t.${q(idColumn)} = i.id
    );
  `;
  
  //--------------------------------------------------
  // 3. Execute
  //--------------------------------------------------
  try {
    const { rows } = await query(sql, [list], client);
    return rows.map((r) => r.id);
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to validate IDs',
      meta: {
        table: `${schema}.${maskedTable}`,
        idColumn,
        count: list.length,
      },
      logFn: logOnError
        ? (err) =>
          logSystemException(err, 'Batch ID existence check failed', {
            context,
            table: `${schema}.${maskedTable}`,
            idColumn,
            count: list.length,
          })
        : undefined,
    });
  }
};

/**
 * Fetches one or more specific columns (default: ['name']) from a table by its primary key (`id`).
 *
 * This utility is safe, generic, and transaction-aware. It supports fetching multiple fields
 * and can be used across different tables that follow a common pattern (UUID `id` as PK).
 *
 * @param {string} table - Table name (e.g., 'order_types')
 * @param {string} id - Primary key value to match (typically a UUID)
 * @param {string|string[]} [selectFields='name'] - Single field or array of fields to retrieve
 * @param {object|null} [client=null] - an Optional pg client for transaction context
 *
 * @returns {Promise<object|null>} - If multiple fields are requested, returns an object like
 *   `{ name: '...', category: '...' }`; if a single field is requested, returns the raw value.
 *
 * @throws {AppError} - Throws databaseError if a query fails or validationError if input is invalid
 */
const getFieldsById = async (
  table,
  id,
  selectFields = ['name'],
  client = null
) => {
  if (!table || typeof table !== 'string' || !id) {
    throw AppError.validationError('Invalid parameters for getFieldsById');
  }
  
  const maskedTable = maskTableName(table);
  
  const safeFields = selectFields
    .map((field) => field.replace(/[^a-zA-Z0-9_]/g, ''))
    .filter(Boolean);

  if (safeFields.length === 0) {
    throw AppError.validationError(`Invalid select fields: ${selectFields}`);
  }

  const sql = `
    SELECT ${safeFields.join(', ')}
    FROM ${table}
    WHERE id = $1
  `;

  try {
    const result = await query(sql, [id], client);
    if (result.rows.length === 0) return null;
    if (result.rows.length > 1) {
      throw AppError.databaseError(
        `Duplicate id in table '${maskedTable}': ${id}`
      );
    }

    return result.rows[0]; // returns an object like { name: ..., category: ... }
  } catch (error) {
    throw handleDbError(error, {
      context: 'db/getFieldsById',
      message: `Failed to fetch fields from '${maskedTable}'`,
      meta: {
        table: maskedTable,
        id,
        selectFields: safeFields,
      },
      logFn: (err) =>
        logSystemException(err, 'Failed to fetch fields by ID', {
          context: 'db/getFieldsById',
          table: maskedTable,
          id,
          selectFields: safeFields,
        }),
    });
  }
};

/**
 * Retrieves an array of values from one column (`selectField`) in a table,
 * filtered by a specific match condition on another column (`whereKey`).
 *
 * This utility is useful for simple lookups like:
 * - Getting all `id`s where `category = 'sales'`
 * - Fetching all `code`s where `status = 'active'`
 *
 * Internally:
 * - Table and field names are sanitized to prevent SQL injection.
 * - Query uses parameterized values (`$1`) for safe substitution.
 * - Supports optional `pg.PoolClient` for transactional context.
 *
 * @async
 * @param {string} table - Name of the table to query (e.g., `'order_types'`).
 * @param {string} whereKey - Name of the column to filter by (e.g., `'category'`).
 * @param {any} whereValue - Value to filter against (e.g., `'sales'`).
 * @param {string} [selectField='id'] - Column to return values from (default is `'id'`).
 * @param {import('pg').PoolClient} [client=null] - Optional database client for transactions.
 * @returns {Promise<any[]>} Array of matching values from `selectField`.
 *
 * @throws {AppError} - If parameters are invalid or the query fails.
 *
 * @example
 * const ids = await getFieldValuesByField('order_types', 'category', 'sales');
 * // Result: ['type-1', 'type-2', 'type-3']
 *
 * @example
 * const codes = await getFieldValuesByField('discounts', 'is_active', true, 'code');
 * // Result: ['SUMMER10', 'FREESHIP']
 */
const getFieldValuesByField = async (
  table,
  whereKey,
  whereValue,
  selectField = 'id',
  client = null
) => {
  try {
    if (!table || !whereKey || !selectField) {
      throw AppError.validationError(
        'Invalid parameters for getFieldValuesByField'
      );
    }

    const cleanField = selectField.replace(/[^a-zA-Z0-9_]/g, '');
    const cleanWhereKey = whereKey.replace(/[^a-zA-Z0-9_]/g, '');
    const maskedTable = table.replace(/[^a-zA-Z0-9_]/g, '');

    const sql = `
      SELECT ${cleanField}
      FROM ${maskedTable}
      WHERE ${cleanWhereKey} = $1
    `;

    const result = await query(sql, [whereValue], client);
    return result.rows.map((row) => row[cleanField]);
  } catch (err) {
    const maskedTable = maskTableName(table);
    
    throw handleDbError(err, {
      context: 'db/getFieldValuesByField',
      message: 'Failed to fetch field values',
      meta: {
        maskedTable,
        whereKey,
        selectField,
      },
      logFn: (error) =>
        logSystemException(error, 'Failed to get field values by field', {
          context: 'db/getFieldValuesByField',
          maskedTable,
          whereKey,
          whereValue,
          selectField,
        }),
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
  updateById,
  getUniqueScalarValue,
  checkRecordExists,
  findMissingIds,
  getFieldsById,
  getFieldValuesByField,
};
