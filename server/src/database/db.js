/**
 * @file db.js
 * @description
 * PostgreSQL connection pool and query execution layer providing:
 * - connection pooling and lifecycle management
 * - query execution with retry and exponential backoff
 * - transaction orchestration (BEGIN / COMMIT / ROLLBACK)
 * - structured logging and slow query monitoring
 * - standardized error normalization via AppError
 *
 * This module is the sole owner of the pg Pool instance. All database
 * access across repositories and services flows through this module.
 *
 * @module database/db
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
} = require('../utils/db-logger');
const { getConnectionConfig, getEnvNumber } = require('../config/db-config');
const AppError = require('../utils/AppError');
const { retry } = require('../utils/retry/retry');
const {
  logSystemException,
  logSystemInfo,
  logSystemWarn,
  logRetryWarning,
  logSystemCrash,
} = require('../utils/logging/system-logger');
const { generateTraceId } = require('../utils/id-utils');
const { handleDbError } = require('../utils/errors/error-handlers');
const { isRetryableDbError } = require('../utils/db/db-error-utils');

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
  application_name: `${process.env.DB_APP_NAME ?? 'wide-erp-api'}:${process.env.NODE_ENV}`,
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
            logDbQueryError(text, params, err, {
              context: 'db/query',
              ...meta,
            }),
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
    throw AppError.validationError(
      `Invalid isolation level: ${isolationLevel}`
    );
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
  const totalClients = pool.totalCount;
  const idleClients = pool.idleCount;
  const waitingRequests = pool.waitingCount;

  // Avoid division by zero when the pool has no clients yet.
  const utilization =
    DB_POOL_MAX > 0 ? (totalClients - idleClients) / DB_POOL_MAX : 0;

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
};
