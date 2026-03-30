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
 * - single-row and multi-row scalar/field lookup utilities
 *
 * This module acts as the core database abstraction layer used across
 * repositories and services to enforce consistency, safety, and observability.
 *
 * @module db
 */

'use strict';

const { Pool, Client } = require('pg');
const { loadEnv } = require('../config/env');
const {
  logDbConnect,
  logDbConnectionError,
  logDbSlowQuery,
  logDbQueryError,
  logDbTransactionEvent,
  logPaginatedQueryError,
  logBulkInsertError,
  logLockRowsError,
  logLockRowError,
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
  logRetryWarning,
  logSystemCrash,
} = require('../utils/logging/system-logger');
const { generateTraceId } = require('../utils/id-utils');
const {
  assertAllowed,
  qualify,
  q,
  validateIdentifier,
} = require('../utils/sql-ident');
const { uniq } = require('../utils/array-utils');
const { handleDbError } = require('../utils/errors/error-handlers');
const { isRetryableDbError } = require('../utils/db/db-error-utils');
const { LOCK_MODE_SET } = require('../utils/db/lock-modes');
const { buildWhereClause, buildInClause } = require('../utils/db/where-builder');
const { applyUpdateRule } = require('../utils/db/upsert-utils');

// ------------------------------------------------------------
// Load environment and resolve database connection configuration
// ------------------------------------------------------------
loadEnv();

const connectionConfig = getConnectionConfig();

// Hoist threshold parse: avoids re-reading and re-parsing env on every call.
const SLOW_QUERY_THRESHOLD_MS =
  parseInt(process.env.SLOW_QUERY_THRESHOLD, 10) || 1000;

// Max pool size resolved once at startup; used in monitorPool to avoid
// accessing the semi-private pool.options.max at call time.
const DB_POOL_MAX = getEnvNumber('DB_POOL_MAX', 10);

// Allowlisted PostgreSQL isolation levels for withTransaction validation.
const ISOLATION_LEVELS = new Set([
  'READ UNCOMMITTED',
  'READ COMMITTED',
  'REPEATABLE READ',
  'SERIALIZABLE',
]);

// Module-scoped sleep helper used by retryDatabaseConnection.
// Defined here rather than inside the function to avoid re-allocating
// the closure on every call.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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
  max: DB_POOL_MAX,
  
  // Time (ms) a client can remain idle before being closed
  idleTimeoutMillis: getEnvNumber('DB_IDLE_TIMEOUT', 30000),
  
  // Max time (ms) to wait for a new connection before throwing error
  connectionTimeoutMillis: getEnvNumber('DB_CONN_TIMEOUT', 2000),
  
  // Optional but highly recommended for observability
  application_name:
    `${process.env.DB_APP_NAME ?? 'wide-erp-api'}:${process.env.NODE_ENV}`,
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
    logFn: logDbConnectionError,
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

// ============================================================
// Core query execution
// ============================================================

/**
 * Executes a parameterized SQL query against the connection pool, with
 * automatic retry on transient errors and slow-query telemetry.
 *
 * When `client` is provided the caller owns the connection lifecycle
 * (transactions). When omitted, a pool client is acquired and released
 * internally.
 *
 * @param {string}      text              - Parameterized SQL string.
 * @param {Array}       [params=[]]       - Bound parameter values.
 * @param {object|null} [client=null]     - Existing pg client (transactional).
 * @param {object}      [options={}]
 * @param {number}      [options.retries=3]     - Max retry attempts.
 * @param {number}      [options.baseDelay=300] - Base backoff delay (ms).
 * @param {object}      [options.meta={}]       - Extra context forwarded to log helpers.
 * @returns {Promise<import('pg').QueryResult>}
 */
const query = async (
  text,
  params = [],
  client = null,
  { retries = 3, baseDelay = 300, meta = {} } = {}
) => {
  return retry(
    async () => {
      const localClient = client ?? (await pool.connect());
      const shouldRelease = !client;
      const startTime = Date.now();
      
      try {
        const result = await localClient.query(text, params);
        
        const duration = Date.now() - startTime;
        if (duration > SLOW_QUERY_THRESHOLD_MS) {
          logDbSlowQuery(text, params, duration, meta);
        }
        
        return result;
      } catch (error) {
        throw handleDbError(error, {
          context: 'db/query',
          message: 'Database query failed',
          meta,
          logFn: (err) =>
            logDbQueryError(text, params, err, { context: 'db/query', ...meta }),
        });
      } finally {
        // Only release if we acquired the client; skip on connect failure
        // (localClient would be undefined, and the error already propagated).
        if (shouldRelease && localClient) {
          localClient.release();
        }
      }
    },
    { retries, baseDelay, shouldRetry: isRetryableDbError }
  );
};

/**
 * Acquires a client from the connection pool.
 *
 * Wraps `pool.connect()` with structured error handling so callers receive
 * a normalized `AppError` on failure rather than a raw pg error.
 *
 * @returns {Promise<import('pg').PoolClient>}
 * @throws {AppError} If the pool cannot provide a client.
 */
const getClient = async () => {
  try {
    return await pool.connect();
  } catch (error) {
    const message = 'Failed to acquire a database client';
    const context = 'db/getClient';
    
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

// ============================================================
// Transaction orchestration
// ============================================================

/**
 * Executes `callback` inside a PostgreSQL transaction, handling BEGIN,
 * COMMIT, ROLLBACK, and client release automatically.
 *
 * The callback receives the active `client` and a `txId` trace identifier.
 * Any error thrown by the callback triggers a ROLLBACK before re-throwing.
 *
 * @param {(client: import('pg').PoolClient, txId: string) => Promise<*>} callback
 *   Async function containing the transactional work.
 * @param {object}  [options={}]
 * @param {string}  [options.isolationLevel='READ COMMITTED']
 *   Must be a valid PostgreSQL isolation level string (validated against allowlist).
 * @param {number}  [options.timeoutMs=5000]
 *   Per-statement timeout in ms, scoped locally via SET LOCAL. Pass 0 to disable.
 * @returns {Promise<*>} Resolves with the return value of `callback`.
 * @throws {AppError} On invalid input, transaction failure, or DB error.
 */
const withTransaction = async (callback, options = {}) => {
  if (typeof callback !== 'function') {
    throw AppError.validationError('Transaction callback must be a function');
  }
  
  const { isolationLevel = 'READ COMMITTED', timeoutMs = 5000 } = options;
  
  // Validate against allowlist — isolationLevel is interpolated into SQL.
  if (!ISOLATION_LEVELS.has(isolationLevel)) {
    throw AppError.validationError(`Invalid isolation level: ${isolationLevel}`);
  }
  
  // timeoutMs is interpolated into SQL; must be a safe non-negative integer.
  if (!Number.isInteger(timeoutMs) || timeoutMs < 0) {
    throw AppError.validationError('timeoutMs must be a non-negative integer');
  }
  
  const client = await getClient();
  const txId = generateTraceId();
  const context = 'db/withTransaction';
  
  try {
    await client.query(`BEGIN ISOLATION LEVEL ${isolationLevel}`);
    logDbTransactionEvent('BEGIN', txId, { isolationLevel });
    
    if (timeoutMs > 0) {
      await client.query(`SET LOCAL statement_timeout = ${timeoutMs}`);
    }
    
    const result = await callback(client, txId);
    
    await client.query('COMMIT');
    logDbTransactionEvent('COMMIT', txId);
    
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
      logDbTransactionEvent('ROLLBACK', txId, { severity: 'critical' });
    } catch (rollbackError) {
      // Rollback failure is logged but not re-thrown — the original error
      // is the authoritative failure signal.
      logSystemException(rollbackError, 'Rollback failed', {
        txId,
        context: `${context}/rollback`,
        severity: 'critical',
      });
    }
    
    throw handleDbError(error, {
      context,
      message: 'Transaction failed',
      meta: { txId, isolationLevel },
      logFn: (err) =>
        logSystemException(err, 'Transaction failed', {
          txId,
          context,
          isolationLevel,
          severity: 'critical',
        }),
    });
  } finally {
    client.release();
  }
};

// ============================================================
// Pool health & lifecycle
// ============================================================

/**
 * Performs a basic database connectivity test.
 *
 * Executes a lightweight `SELECT 1` to confirm the database is reachable.
 * Retries are disabled (retries=0) to fail fast in health-check contexts.
 *
 * @returns {Promise<boolean>} `true` if the connection is healthy.
 * @throws {AppError} If the connectivity test fails.
 */
const testConnection = async () => {
  const context = 'db/testConnection/healthcheck';
  
  try {
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
 * @typedef {Object} PoolMetrics
 * @property {number} totalClients    - Total clients currently in the pool.
 * @property {number} idleClients     - Idle clients waiting for work.
 * @property {number} waitingRequests - Requests queued for an available client.
 * @property {number} utilization     - Ratio of active clients to pool max (0–1).
 */

/**
 * Retrieves PostgreSQL connection pool metrics.
 *
 * Provides insight into:
 * - total active clients
 * - idle clients
 * - queued (waiting) requests
 * - utilization ratio (active / total)
 *
 * Uses the `DB_POOL_MAX` constant resolved at startup rather than
 * `pool.options.max` (semi-private pg internals).
 *
 * Useful for monitoring connection pool health and diagnosing bottlenecks.
 *
 * @returns {PoolMetrics}
 */
const monitorPool = () => {
  const totalClients    = pool.totalCount;
  const idleClients     = pool.idleCount;
  const waitingRequests = pool.waitingCount;
  
  // Avoid division by zero when the pool has no clients yet.
  const utilization = DB_POOL_MAX > 0
    ? (totalClients - idleClients) / DB_POOL_MAX
    : 0;
  
  return {
    totalClients,
    idleClients,
    waitingRequests,
    utilization,
  };
};

let poolClosed = false;
let closingPromise = null;

/**
 * Gracefully shuts down the PostgreSQL connection pool.
 *
 * Ensures:
 * - Idempotent behavior (safe to call multiple times)
 * - Only one close operation executes at a time (concurrent calls reuse the promise)
 * - Does NOT throw on shutdown failure (logs instead, to keep process exit clean)
 *
 * Intended for process shutdown hooks (SIGINT, SIGTERM).
 *
 * @returns {Promise<void>}
 */
const closePool = async () => {
  const context = 'db/closePool/shutdown';
  
  if (poolClosed) {
    logSystemWarn('Pool already closed.', { context });
    return;
  }
  
  // Closing already in progress — reuse the same promise so concurrent
  // callers don't race to call pool.end() twice.
  if (closingPromise) {
    return closingPromise;
  }
  
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
      
      // Do NOT rethrow — shutdown must remain safe regardless of pool errors.
    }
  })();
  
  return closingPromise;
};

/**
 * Retries database connectivity using a temporary `Client` (not the pool).
 *
 * Intended for:
 * - Startup readiness checks before the pool begins accepting queries
 * - Infrastructure health verification in container orchestration
 *
 * Features:
 * - Exponential backoff with jitter
 * - Per-attempt connection timeout (prevents hanging)
 * - Structured logging with retry visibility
 * - Safe resource cleanup (client always closed after each attempt)
 *
 * Design principles:
 * - Fails fast on invalid input
 * - No silent failures (final attempt throws)
 * - Context-aware logging (propagates caller context)
 *
 * @param {object} config                              - PostgreSQL connection config (passed to `pg.Client`).
 * @param {object} [options={}]
 * @param {number} [options.retries=5]                 - Maximum retry attempts.
 * @param {number} [options.baseDelayMs=500]           - Initial delay for backoff (ms).
 * @param {number} [options.maxDelayMs=5000]           - Maximum delay cap (ms).
 * @param {number} [options.connectTimeoutMs=3000]     - Timeout per connection attempt (ms).
 * @param {string} [options.context='db/retryDatabaseConnection'] - Logging context label.
 * @returns {Promise<void>}
 * @throws {AppError} If all retry attempts fail.
 */
const retryDatabaseConnection = async (config, options = {}) => {
  if (!config || typeof config !== 'object') {
    throw new Error('retryDatabaseConnection: "config" must be a valid object');
  }
  
  const {
    retries = 5,
    baseDelayMs = 500,
    maxDelayMs = 5000,
    connectTimeoutMs = 3000,
    context = 'db/retryDatabaseConnection',
  } = options;
  
  // Exponential backoff with jitter: caps at maxDelayMs, adds up to 200ms of
  // random jitter to prevent thundering herd on simultaneous startup.
  const computeDelay = (attempt) => {
    const exp = Math.min(maxDelayMs, baseDelayMs * 2 ** (attempt - 1));
    const jitter = Math.floor(Math.random() * 200);
    return exp + jitter;
  };
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    const client = new Client({
      ...config,
      connectionTimeoutMillis: connectTimeoutMs,
    });
    
    try {
      await client.connect();
      
      logSystemInfo('Database connection successful', {
        context,
        attempt,
        retries,
        status: 'connected',
      });
      
      await client.end();
      return;
    } catch (error) {
      // Always close the client regardless of success or failure.
      await client.end().catch(() => {});
      
      if (attempt === retries) {
        const message = 'Database connection failed after retries';
        
        throw handleDbError(error, {
          context,
          message,
          meta: { attempts: attempt, retries },
          logFn: (err) =>
            logSystemCrash(err, message, {
              context,
              attempts: attempt,
              retries,
            }),
        });
      }
      
      const delayMs = computeDelay(attempt);
      logRetryWarning(attempt, retries, error, delayMs);
      await sleep(delayMs);
    }
  }
};

// ============================================================
// Pagination
// ============================================================

/**
 * Wraps a complex SQL query in a `COUNT(*)` subquery.
 *
 * Used to derive a total-count query from a data query before adding
 * LIMIT/OFFSET — correctly handles CTEs and grouped queries that cannot
 * be wrapped with a simple `SELECT COUNT(*) WHERE ...`.
 *
 * Strips any trailing semicolon before wrapping to produce valid SQL.
 *
 * @param {string} queryText      - The full query to count rows from.
 * @param {string} [alias='subquery'] - Alias applied to the wrapped subquery.
 * @returns {string} A SQL string: `SELECT COUNT(*) AS total_count FROM (...) AS <alias>`.
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
 *
 * Runs the data query and its derived count query in parallel via
 * `Promise.all` for a single round-trip cost. LIMIT/OFFSET are appended
 * to the data query using the next available parameter indices.
 *
 * @param {object} options
 * @param {string}   options.dataQuery      - Base SQL query (must NOT include LIMIT/OFFSET).
 * @param {Array}    [options.params=[]]    - Parameters for the base query.
 * @param {number}   [options.page=1]       - Page number (1-based).
 * @param {number}   [options.limit=20]     - Page size.
 * @param {object}   [options.meta={}]      - Optional metadata for logging (e.g., traceId, context).
 * @returns {Promise<{ data: object[], pagination: { page: number, limit: number, totalRecords: number, totalPages: number } }>}
 * @throws {AppError} On query failure.
 */
const paginateResults = async ({
                                 dataQuery,
                                 params = [],
                                 page = 1,
                                 limit = 20,
                                 meta = {},
                               }) => {
  const offset = (page - 1) * limit;
  
  // Append LIMIT/OFFSET as the next positional parameters after the caller's params.
  const paginatedQuery = `${dataQuery.trim().replace(/;$/, '')} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  const paginatedParams = [...params, limit, offset];
  
  const countQuery = getCountQuery(dataQuery);
  
  try {
    const [dataRows, countResult] = await Promise.all([
      query(paginatedQuery, paginatedParams),
      query(countQuery, params),
    ]);
    
    /** @type {{ total_count: string | number }[]} */
    const countRows = countResult.rows;
    
    const totalRecords = Number(countRows[0]?.total_count ?? 0);
    const totalPages = Math.ceil(totalRecords / limit);
    
    return {
      data: dataRows.rows ?? [],
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
      meta: { page, limit, ...meta },
      logFn: (err) =>
        logPaginatedQueryError(err, dataQuery, countQuery, params, {
          page,
          limit,
          ...meta,
        }),
    });
  }
};

// ============================================================
// Row locking
// ============================================================

/**
 * Locks a single row by primary key within an active transaction.
 *
 * Executes `SELECT * FROM <table> WHERE id = $1 <lockMode>` to acquire
 * a row-level lock. The caller is responsible for surrounding this call
 * with `withTransaction`.
 *
 * Design notes:
 * - Assumes a standardized primary key column named `id`
 * - Uses `qualify` and `q` for safe identifier quoting
 * - Guarantees exactly one row or throws `NotFoundError`
 *
 * @param {import('pg').PoolClient} client   - Active transaction client.
 * @param {string}                  table    - Table name (validated upstream).
 * @param {string}                  id       - Primary key UUID value.
 * @param {string}                  [lockMode='FOR UPDATE'] - PostgreSQL lock mode (validated against allowlist).
 * @param {object}                  [meta={}]              - Additional logging metadata.
 * @returns {Promise<object>} The locked row.
 * @throws {AppError} On invalid input, row not found, or query failure.
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
  
  if (!id || typeof id !== 'string') {
    throw AppError.validationError('Invalid id', { context });
  }
  
  if (!LOCK_MODE_SET.has(lockMode)) {
    throw AppError.validationError(`Invalid lock mode: ${lockMode}`, { context });
  }
  
  const sql = `
    SELECT *
    FROM ${qualify('public', table)}
    WHERE ${q('id')} = $1
    ${lockMode}
  `;
  
  try {
    const { rows } = await query(sql, [id], client);
    
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
 * Locks multiple rows within an active transaction.
 *
 * Supports two condition shapes:
 * - **Primitive array** (e.g., `['id-1', 'id-2']`): generates `WHERE id IN (...)`.
 *   Index-optimized; logs a warning on partial match.
 * - **Object array** (e.g., `[{ tenant_id: 'x', sku: 'y' }]`): generates composite
 *   `WHERE (a=$1 AND b=$2) OR (...)`. Degrades with size — batch at > 50 rows.
 *
 * Must be called inside a transaction. Uses `qualify` / `q` for safe identifier quoting.
 *
 * @param {import('pg').PoolClient} client        - Active transaction client.
 * @param {string}                  table         - Table name.
 * @param {Array<string|object>}    conditions    - IDs (primitives) or condition objects.
 * @param {string}                  [lockMode='FOR UPDATE'] - PostgreSQL lock mode.
 * @param {object}                  [meta={}]               - Additional logging metadata.
 * @returns {Promise<object[]>} Locked rows.
 * @throws {AppError} On invalid input or query failure.
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
  
  if (!Array.isArray(conditions) || conditions.length === 0) {
    throw AppError.validationError('Invalid conditions', { context });
  }
  
  if (!LOCK_MODE_SET.has(lockMode)) {
    throw AppError.validationError(`Invalid lock mode: ${lockMode}`, { context });
  }
  
  // Determine condition shape: primitives → IN clause; objects → composite WHERE.
  const isPrimitiveList =
    typeof conditions[0] !== 'object' || conditions[0] === null;
  
  const sanitizedConditions = conditions.filter(
    (v) => v !== null && v !== undefined
  );
  
  if (sanitizedConditions.length === 0) {
    throw AppError.validationError('Empty conditions after sanitization', { context });
  }
  
  const { clause, values } = isPrimitiveList
    ? buildInClause('id', sanitizedConditions)
    : buildWhereClause(sanitizedConditions);
  
  const sql = `
    SELECT *
    FROM ${qualify('public', table)}
    WHERE ${clause}
    ${lockMode}
  `;
  
  try {
    const { rows } = await query(sql, values, client);
    
    // Warn when fewer rows were locked than requested — indicates missing records.
    if (isPrimitiveList && rows.length !== sanitizedConditions.length) {
      logSystemWarn('Partial row lock result', {
        context: `${context}/partial`,
        expected: sanitizedConditions.length,
        found: rows.length,
        table: maskedTable,
      });
    }
    
    // Composite OR conditions degrade with size — alert early.
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

// ============================================================
// Bulk operations
// ============================================================

// pg hard limit is 65535 parameters per query; stay comfortably below it.
const MAX_PARAMS = 60000;

/**
 * Inserts multiple rows into a table using a bulk UPSERT pattern.
 *
 * Features:
 * - Efficient multi-row INSERT using `VALUES ($1, $2, ...), (...), ...`
 * - ON CONFLICT DO UPDATE with per-column strategy-based resolution
 * - Computed updates via `extraUpdates` for derived fields (e.g., `updated_at = NOW()`)
 * - Falls back to ON CONFLICT DO NOTHING when no update strategies are provided
 * - Retry support via the internal `query()` wrapper
 *
 * Update strategies (passed in `updateStrategies`):
 * `add`, `subtract`, `max`, `min`, `coalesce`, `merge_jsonb`, `merge_text`, `overwrite`, `keep`
 *
 * Identifier safety:
 * All table names and column names are run through `validateIdentifier` before
 * interpolation into SQL.
 *
 * Parameter limit:
 * Total parameters (`rows.length × columns.length`) must stay below `MAX_PARAMS` (60 000).
 * Split large batches into chunks at the call site.
 *
 * @param {string}                 tableName
 * @param {string[]}               columns            - Column names in the same order as row values.
 * @param {Array<Array<*>>}        rows               - Row values; each inner array must have `columns.length` elements.
 * @param {string[]}               [conflictColumns=[]]   - Columns forming the conflict target.
 * @param {Object<string,string>}  [updateStrategies={}]  - Map of column → strategy for DO UPDATE.
 * @param {import('pg').PoolClient|null} [client=null]
 * @param {object}                 [options={}]
 * @param {object}                 [options.meta={}]        - Logging metadata.
 * @param {string[]}               [options.extraUpdates=[]] - Raw SQL update fragments appended after strategy updates.
 * @param {string|null}            [returning='id']         - RETURNING clause column(s); `null` omits it.
 * @returns {Promise<object[]>} Rows returned by the RETURNING clause (empty array if none).
 * @throws {AppError} On validation failure or query error.
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
  
  if (!Array.isArray(rows) || rows.length === 0) return [];
  
  if (!rows.every((r) => Array.isArray(r) && r.length === columns.length)) {
    throw AppError.validationError(
      `Invalid rows: expected ${columns.length} columns`
    );
  }
  
  const totalParams = rows.length * columns.length;
  if (totalParams >= MAX_PARAMS) {
    throw AppError.validationError(
      'Batch too large, split into smaller chunks'
    );
  }
  
  // Validate extraUpdates before doing any other work so failures are caught early.
  if (!Array.isArray(extraUpdates)) {
    throw AppError.validationError('extraUpdates must be an array');
  }
  
  // Run all identifiers through validateIdentifier to prevent injection.
  const safeTable = validateIdentifier(tableName, 'table');
  const safeColumns = columns.map((c) => validateIdentifier(c, 'column'));
  const safeConflictColumns = conflictColumns.map((c) =>
    validateIdentifier(c, 'conflict column')
  );
  const safeUpdateColumns = Object.keys(updateStrategies).map((c) =>
    validateIdentifier(c, 'update column')
  );
  
  const columnNames = safeColumns.join(', ');
  
  const valuePlaceholders = rows
    .map(
      (_, i) =>
        `(${safeColumns
          .map((_, j) => `$${i * safeColumns.length + j + 1}`)
          .join(', ')})`
    )
    .join(', ');
  
  let conflictClause = '';
  
  if (safeConflictColumns.length > 0) {
    const tableAlias = 't';
    
    const updateSet = safeUpdateColumns
      .map((col) => applyUpdateRule(col, updateStrategies[col], tableAlias))
      .filter(Boolean);
    
    if (extraUpdates.length > 0) {
      updateSet.push(...extraUpdates);
    }
    
    conflictClause =
      updateSet.length > 0
        ? `ON CONFLICT (${safeConflictColumns.join(', ')}) DO UPDATE SET ${updateSet.join(', ')}`
        : `ON CONFLICT (${safeConflictColumns.join(', ')}) DO NOTHING`;
  }
  
  const returningClause = returning ? `RETURNING ${returning}` : '';
  
  const sql = `
    INSERT INTO ${safeTable} AS t (${columnNames})
    VALUES ${valuePlaceholders}
    ${conflictClause}
    ${returningClause};
  `;
  
  const values = rows.flat();
  
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
      meta: { table: maskedTable, rowCount: rows.length },
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

// ============================================================
// Single-record mutations
// ============================================================

/**
 * Updates a single record by primary key with validation, audit handling,
 * and structured error management.
 *
 * Designed for repository-layer usage with strict safety guarantees:
 * - prevents updates to protected/system fields (`id`, `created_at`, `created_by`)
 * - enforces allowed schema/table access via `assertAllowed`
 * - supports automatic audit metadata injection (`updated_by`, `updated_at`)
 * - builds fully parameterized SQL (no injection risk)
 * - optionally restricts updates to a caller-supplied `allowedFields` set
 *
 * @param {string}                   table              - Target table name.
 * @param {string}                   id                 - Primary key UUID.
 * @param {object}                   updates            - Fields to update (undefined values are stripped).
 * @param {string|null}              userId             - User performing the update (injected as `updated_by`).
 * @param {import('pg').PoolClient}  client             - Active pg client or transaction.
 * @param {object}                   [options={}]
 * @param {string}                   [options.schema='public']
 * @param {string}                   [options.updatedAtField='updated_at']
 * @param {string}                   [options.updatedByField='updated_by']
 * @param {string}                   [options.idField='id']          - Primary key column name.
 * @param {Set<string>|null}         [options.allowedFields=null]    - Optional whitelist of updatable fields.
 * @returns {Promise<{ id: string }>} The updated record's primary key.
 * @throws {AppError} ValidationError, NotFoundError, or DatabaseError.
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
  
  if (!id || typeof id !== 'string' || !table || typeof table !== 'string') {
    throw AppError.validationError('Invalid update request.', { context });
  }
  
  if (!updates || typeof updates !== 'object') {
    throw AppError.validationError('Updates must be an object.', { context });
  }
  
  // Validate table/schema access before touching the payload.
  assertAllowed(schema, table);
  
  const PROTECTED_FIELDS = new Set(['id', 'created_at', 'created_by']);
  
  const updateData = Object.entries(updates).reduce((acc, [key, value]) => {
    if (value === undefined) return acc;
    
    if (PROTECTED_FIELDS.has(key)) {
      throw AppError.validationError('Invalid update field.', { context, field: key });
    }
    
    if (allowedFields && !allowedFields.has(key)) {
      throw AppError.validationError('Field not allowed.', { context, field: key });
    }
    
    acc[key] = value;
    return acc;
  }, {});
  
  if (userId && updatedByField) {
    updateData[updatedByField] = userId;
  }
  
  const fields = Object.keys(updateData);
  
  if (fields.length === 0) {
    throw AppError.validationError('No valid fields provided to update.', { context });
  }
  
  // Build SET clause: $1 is reserved for the WHERE id = $1 condition.
  const setClauses = fields.map((field, idx) => `${q(field)} = $${idx + 2}`);
  
  if (updatedAtField) {
    setClauses.push(`${q(updatedAtField)} = NOW()`);
  }
  
  const values = [id, ...fields.map((f) => updateData[f])];
  
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
      meta: { schema, table: maskedTable, id, fields },
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

// ============================================================
// Scalar / field lookup utilities
// ============================================================

/**
 * Retrieves a single scalar value from a table matching a WHERE condition.
 *
 * Supports one or more key-value pairs in `where` — all are combined with
 * AND. Uses `LIMIT 2` internally to detect unexpected duplicate rows; throws
 * a `DatabaseError` if more than one row matches. Returns `null` when no
 * matching row is found.
 *
 * Null values in `where` are converted to `IS NULL` conditions.
 * All identifiers are quoted via `q`/`qualify` to prevent SQL injection.
 *
 * @param {object}                  params
 * @param {string}                  params.table  - Table name.
 * @param {object}                  params.where  - One or more key-value WHERE conditions.
 * @param {string}                  params.select - Column whose value is returned.
 * @param {import('pg').PoolClient} [client]      - Optional transaction client.
 * @param {object}                  [meta={}]     - Logging metadata.
 * @returns {Promise<*|null>} The scalar value, or `null` if not found.
 * @throws {AppError} On invalid input, duplicate row, or query failure.
 *
 * @example
 * const email = await getUniqueScalarValue(
 *   { table: 'users', where: { id: userId }, select: 'email' }
 * );
 *
 * @example
 * const addressId = await getUniqueScalarValue(
 *   { table: 'addresses', where: { full_name: 'John Doe', label: 'Shipping' }, select: 'id' }
 * );
 */
const getUniqueScalarValue = async (
  { table, where, select },
  client,
  meta = {}
) => {
  if (!table || typeof where !== 'object' || !select) {
    throw AppError.validationError(
      'Invalid parameters for getUniqueScalarValue.'
    );
  }
  
  const maskedTable = maskTableName(table);
  const whereKeys = Object.keys(where ?? {});
  
  if (whereKeys.length === 0) {
    throw AppError.validationError(
      'getUniqueScalarValue: where condition must have at least one key.'
    );
  }
  
  // Build multi-condition WHERE clause with correct $N indices.
  let paramIdx = 1;
  const whereParts = [];
  const whereValues = [];
  
  for (const key of whereKeys) {
    const val = where[key];
    if (val === null) {
      whereParts.push(`${q(key)} IS NULL`);
    } else {
      whereParts.push(`${q(key)} = $${paramIdx++}`);
      whereValues.push(val);
    }
  }
  
  const sql = `
    SELECT ${q(select)}
    FROM ${qualify('public', table)}
    WHERE ${whereParts.join(' AND ')}
    LIMIT 2
  `;
  
  try {
    const result = await query(sql, whereValues, client);
    
    if (result.rows.length === 0) return null;
    
    if (result.rows.length > 1) {
      throw AppError.databaseError(
        `Multiple rows found in "${maskedTable}" for ${whereKeys.join(', ')}`
      );
    }
    
    return result.rows[0][select];
  } catch (error) {
    throw handleDbError(error, {
      context: 'db/getUniqueScalarValue',
      message: `Failed to fetch value '${select}' from '${maskedTable}'.`,
      meta: { table: maskedTable, select, where: Object.fromEntries(whereKeys.map(k => [k, where[k]])), ...meta },
      logFn: (err) =>
        logDbQueryError(sql, whereValues, err, {
          context: 'db/getUniqueScalarValue',
          table: maskedTable,
          select,
          ...meta,
        }),
    });
  }
};

/**
 * Checks whether a record matching `condition` exists in `table`.
 *
 * Supports `null` values in the condition by converting them to `IS NULL`
 * in the WHERE clause.
 *
 * Uses `validateIdentifier` for the table name and quotes each condition
 * key via `q()` to prevent SQL injection on column names.
 *
 * @param {string}                   table      - Table name.
 * @param {object}                   condition  - Key-value WHERE condition; null values → IS NULL.
 * @param {import('pg').PoolClient}  [client=null]
 * @returns {Promise<boolean>} `true` if a matching record exists.
 * @throws {AppError} On invalid input or query failure.
 *
 * @example
 * // Standard value condition
 * await checkRecordExists('orders', { id: orderId });
 *
 * // Null condition (IS NULL)
 * await checkRecordExists('addresses', { customer_id: null });
 */
const checkRecordExists = async (table, condition, client = null) => {
  // Use validateIdentifier for consistency with the rest of the module.
  const safeTable = validateIdentifier(table, 'table');
  
  const keys = Object.keys(condition ?? {});
  if (keys.length === 0) {
    throw AppError.validationError('No condition provided for checkRecordExists');
  }
  
  // Build a stable, ordered list of [key, value] pairs so that the
  // $N parameter indices align correctly with the values array.
  let paramIdx = 1;
  const whereParts = [];
  const values = [];
  
  for (const key of keys) {
    const val = condition[key];
    if (val === null) {
      // Null values use IS NULL — no parameter placeholder needed.
      whereParts.push(`${q(key)} IS NULL`);
    } else {
      whereParts.push(`${q(key)} = $${paramIdx++}`);
      values.push(val);
    }
  }
  
  const sql = `SELECT EXISTS (SELECT 1 FROM ${safeTable} WHERE ${whereParts.join(' AND ')}) AS exists`;
  
  try {
    const { rows } = await query(sql, values, client);
    return rows[0]?.exists === true;
  } catch (error) {
    const maskedTable = maskTableName(table);
    
    throw handleDbError(error, {
      context: 'db/checkRecordExists',
      message: `Failed to check existence in "${maskedTable}"`,
      meta: { table: maskedTable },
      logFn: (err) =>
        logSystemException(err, 'Failed to check record existence', {
          context: 'db/checkRecordExists',
          table: maskedTable,
        }),
    });
  }
};

/**
 * Returns IDs from `ids` that are NOT present in `<schema>.<table>.<idColumn>`.
 *
 * Uses a single `UNNEST`-based query (one round-trip) to avoid N+1 lookups.
 * Deduplicates `ids` before querying via `uniq`.
 *
 * @param {import('pg').PoolClient} client
 * @param {string}                  table
 * @param {string[]}                ids
 * @param {object}                  [opts={}]
 * @param {string}                  [opts.schema='public']
 * @param {string}                  [opts.idColumn='id']
 * @param {boolean}                 [opts.logOnError=true]
 * @returns {Promise<string[]>} IDs from the input list that have no matching row.
 * @throws {AppError} On query failure.
 */
const findMissingIds = async (client, table, ids, opts = {}) => {
  const context = 'db/findMissingIds';
  
  const {
    schema = 'public',
    idColumn = 'id',
    logOnError = true,
  } = opts;
  
  const list = uniq(ids);
  if (list.length === 0) return [];
  
  const maskedTable = maskTableName(table);
  
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
 * Fetches one or more columns from a table row by its primary key.
 *
 * Returns the full row object (e.g., `{ name: '...', category: '...' }`).
 * Returns `null` if no row matches. Throws `DatabaseError` on duplicate
 * primary key (data integrity violation).
 *
 * Column names are sanitized via `validateIdentifier`. Table name is
 * quoted via `qualify`.
 *
 * @param {string}                   table                   - Table name.
 * @param {string}                   id                      - Primary key UUID.
 * @param {string|string[]}          [selectFields=['name']] - Column(s) to retrieve.
 * @param {import('pg').PoolClient}  [client=null]
 * @returns {Promise<object|null>} Row object with the requested fields, or `null`.
 * @throws {AppError} On invalid input or query failure.
 *
 * @example
 * const row = await getFieldsById('order_types', typeId, ['name', 'category']);
 * // { name: 'Standard', category: 'sales' }
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
  
  // Use validateIdentifier for consistency — rejects unsafe names with a
  // structured error rather than silently stripping characters.
  const safeFields = (Array.isArray(selectFields) ? selectFields : [selectFields])
    .map((field) => validateIdentifier(field, 'select field'));
  
  const sql = `
    SELECT ${safeFields.map((f) => q(f)).join(', ')}
    FROM ${qualify('public', table)}
    WHERE ${q('id')} = $1
    LIMIT 2
  `;
  
  try {
    const result = await query(sql, [id], client);
    
    if (result.rows.length === 0) return null;
    
    if (result.rows.length > 1) {
      throw AppError.databaseError(
        `Duplicate id in table '${maskedTable}'`
      );
    }
    
    return result.rows[0];
  } catch (error) {
    throw handleDbError(error, {
      context: 'db/getFieldsById',
      message: `Failed to fetch fields from '${maskedTable}'`,
      meta: { table: maskedTable, selectFields: safeFields },
      logFn: (err) =>
        logSystemException(err, 'Failed to fetch fields by ID', {
          context: 'db/getFieldsById',
          table: maskedTable,
          selectFields: safeFields,
        }),
    });
  }
};

/**
 * Returns an array of values from `selectField` in `table`, filtered
 * by a single `whereKey = whereValue` condition.
 *
 * Useful for simple lookups such as:
 * - all `id`s where `category = 'sales'`
 * - all `code`s where `is_active = true`
 *
 * All identifiers are run through `validateIdentifier` and quoted via `q`/`qualify`.
 * Validation throws are separated from the IO try/catch to prevent double-logging.
 *
 * @param {string}                   table
 * @param {string}                   whereKey     - Column to filter by.
 * @param {*}                        whereValue   - Value to filter against.
 * @param {string}                   [selectField='id'] - Column whose values are returned.
 * @param {import('pg').PoolClient}  [client=null]
 * @returns {Promise<*[]>} Array of values from `selectField`.
 * @throws {AppError} On invalid input or query failure.
 *
 * @example
 * const ids = await getFieldValuesByField('order_types', 'category', 'sales');
 * // ['type-1', 'type-2']
 *
 * @example
 * const codes = await getFieldValuesByField('discounts', 'is_active', true, 'code');
 * // ['SUMMER10', 'FREESHIP']
 */
const getFieldValuesByField = async (
  table,
  whereKey,
  whereValue,
  selectField = 'id',
  client = null
) => {
  // Validate before entering the IO try/catch so a ValidationError thrown
  // here is NOT caught below and therefore not double-logged.
  if (!table || !whereKey || !selectField) {
    throw AppError.validationError(
      'Invalid parameters for getFieldValuesByField'
    );
  }
  
  const safeTable    = validateIdentifier(table, 'table');
  const safeField    = validateIdentifier(selectField, 'select field');
  const safeWhereKey = validateIdentifier(whereKey, 'where key');
  
  const sql = `
    SELECT ${q(safeField)}
    FROM ${qualify('public', safeTable)}
    WHERE ${q(safeWhereKey)} = $1
  `;
  
  try {
    const result = await query(sql, [whereValue], client);
    return result.rows.map((row) => row[safeField]);
  } catch (error) {
    const maskedTable = maskTableName(table);
    
    throw handleDbError(error, {
      context: 'db/getFieldValuesByField',
      message: 'Failed to fetch field values',
      meta: { table: maskedTable, whereKey, selectField },
      logFn: (err) =>
        logSystemException(err, 'Failed to get field values by field', {
          context: 'db/getFieldValuesByField',
          table: maskedTable,
          whereKey,
          selectField,
        }),
    });
  }
};

// ============================================================
// Exports
// ============================================================
module.exports = {
  pool,
  query,
  getClient,
  withTransaction,
  closePool,
  testConnection,
  monitorPool,
  retryDatabaseConnection,
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
