/**
 * @file db-logger.js
 * @description Database-level logging utilities (low-noise, production-safe).
 *
 * Responsibilities:
 *   - Log ONLY meaningful DB events (errors, slow queries, system health)
 *   - Avoid high-frequency noise (every query success should NOT be logged)
 *   - Ensure all logs carry consistent database layer context
 *
 * Design:
 *   - No request context — DB layer operates below the request lifecycle
 *   - Uses system logger for infrastructure-level events (connect, crash)
 *   - Uses logError / logWarn for query and operational events
 *   - All query params are masked before logging via maskSensitiveParams
 *   - Query strings are truncated at 500 chars to prevent oversized log entries
 *
 * Log level guide:
 *   logSystemInfo / logDbInfo  — connection established, tx committed, record found
 *   logWarn / logDbSlowQuery   — slow queries, unexpected but non-fatal conditions
 *   logError / logDbQueryError — query failures, lock errors, bulk insert errors
 *   logSystemException         — connection failures, pool crashes (infrastructure)
 */

'use strict';

const {
  logSystemInfo,
  logSystemException,
} = require('./logging/system-logger');
const { logWarn, logError } = require('./logging/logger-helper');
const { maskSensitiveParams } = require('./masking/mask-sensitive-params');

// -----------------------------------------------------------------------------
// Context helper
// Stamps every log entry with a consistent database layer identity so log
// queries can filter by layer without relying on per-function context strings.
// -----------------------------------------------------------------------------

/**
 * Merges caller-supplied meta with standard database layer identifiers.
 *
 * @param {object} [meta={}] - Caller-supplied metadata to merge.
 * @returns {object} Meta object stamped with `traceId: 'system'` and `layer: 'database'`.
 */
const withDbContext = (meta = {}) => ({
  traceId: 'system',
  layer: 'database',
  ...meta,
});

// -----------------------------------------------------------------------------
// Connection
// -----------------------------------------------------------------------------

/**
 * Logs a successful database connection at system info level.
 * Called once per pool initialization — not per query.
 *
 * @returns {void}
 */
const logDbConnect = () => {
  logSystemInfo('Database connected', {
    context: 'database',
  });
};

/**
 * Logs a database **connection** error at system exception level.
 *
 * Use only for pool-level or connection-level failures (e.g. pg `error` event,
 * pool exhaustion, startup connectivity failure). For query errors use
 * `logDbQueryError` instead.
 *
 * @param {Error} error - The connection error.
 * @returns {void}
 */
const logDbConnectionError = (error) => {
  logSystemException(error, 'Database connection error', {
    context: 'database',
    crash: true,
  });
};

// -----------------------------------------------------------------------------
// Info — low-frequency success events
// -----------------------------------------------------------------------------

/**
 * Logs a low-frequency informational DB event at system info level.
 *
 * Use for meaningful outcomes only — e.g. record found, transaction committed,
 * migration applied. Never use for every query success; high-frequency success
 * logging creates noise that drowns out meaningful signal in production logs.
 *
 * @param {string} message   - Human-readable event description.
 * @param {object} [meta={}] - Additional context (context, table, rowCount, etc.).
 * @returns {void}
 */
const logDbInfo = (message, meta = {}) => {
  logSystemInfo(message, withDbContext(meta));
};

// -----------------------------------------------------------------------------
// Query helpers — private, not exported
// -----------------------------------------------------------------------------

/**
 * Truncates a query string to 500 characters to prevent oversized log entries.
 * Non-string values (e.g. object with dataQuery/countQuery) are returned as-is.
 *
 * @param {string | unknown} query - Raw query string or query descriptor object.
 * @returns {string | unknown} Truncated string or original value unchanged.
 */
const truncateQuery = (query) =>
  typeof query === 'string' && query.length > 500
    ? `${query.slice(0, 500)}...[truncated]`
    : query;

/**
 * Builds standardized metadata for a successful or slow query log entry.
 *
 * @param {string | object} query      - SQL query string or descriptor.
 * @param {unknown[]}       params     - Query parameters (will be masked).
 * @param {number}          durationMs - Query execution time in milliseconds.
 * @param {object}          [extraMeta={}] - Additional caller-supplied context.
 * @returns {object}
 */
const buildQueryMeta = (query, params, durationMs, extraMeta = {}) => ({
  query: truncateQuery(query),
  params: maskSensitiveParams(params),
  durationMs,
  ...extraMeta,
});

/**
 * Builds standardized metadata for a query error log entry.
 * Stack trace is included in non-production environments only.
 *
 * @param {string | object} query      - SQL query string or descriptor.
 * @param {unknown[]}       params     - Query parameters (will be masked).
 * @param {Error}           error      - The caught error.
 * @param {object}          [extraMeta={}] - Additional caller-supplied context.
 * @returns {object}
 */
const buildQueryErrorMeta = (query, params, error, extraMeta = {}) => ({
  query: truncateQuery(query),
  params: maskSensitiveParams(params),
  errorName: error.name,
  errorMessage: error.message,
  // Include stack in non-production only — stacks are verbose and should
  // never appear in production log streams.
  ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {}),
  ...extraMeta,
});

// -----------------------------------------------------------------------------
// Query logging — low noise
// -----------------------------------------------------------------------------

/**
 * Logs a slow query warning.
 * Triggered when query execution time exceeds the configured slow query threshold.
 *
 * @param {string}   query      - SQL query string.
 * @param {unknown[]} params    - Query parameters (will be masked).
 * @param {number}   duration   - Query execution time in milliseconds.
 * @param {object}   [meta={}]  - Additional context (context, table, etc.).
 * @returns {void}
 */
const logDbSlowQuery = (query, params, duration, meta = {}) => {
  logWarn(
    'Slow query detected',
    null,
    withDbContext(
      buildQueryMeta(query, params, duration, {
        slow: true,
        ...meta,
      })
    )
  );
};

/**
 * Logs a query execution error.
 * Use for failed SELECT, INSERT, UPDATE, DELETE operations.
 * For connection-level failures use `logDbConnectionError` instead.
 *
 * @param {string}   query      - SQL query string.
 * @param {unknown[]} params    - Query parameters (will be masked).
 * @param {Error}    error      - The caught error.
 * @param {object}   [meta={}]  - Additional context (context, table, etc.).
 * @returns {void}
 */
const logDbQueryError = (query, params, error, meta = {}) => {
  logError(
    error,
    null,
    withDbContext(buildQueryErrorMeta(query, params, error, meta))
  );
};

// -----------------------------------------------------------------------------
// Transactions
// -----------------------------------------------------------------------------

/**
 * Logs a transaction lifecycle event (begin, commit, rollback) at info level.
 *
 * Transaction events are normal DB operations — they are logged at info, not
 * warn, unless the action itself indicates a problem (e.g. unexpected rollback).
 * Pass `warn: true` in meta to escalate a specific event to warn level.
 *
 * @param {'begin' | 'commit' | 'rollback' | string} action - Transaction action label.
 * @param {string | number} txId   - Transaction identifier for correlation.
 * @param {object}          [meta={}] - Additional context. Pass `warn: true` to
 *   log at warn level instead of info (e.g. for unexpected rollbacks).
 * @returns {void}
 */
const logDbTransactionEvent = (action, txId, meta = {}) => {
  const { warn: isWarn, ...restMeta } = meta;

  const logMeta = withDbContext({
    context: 'transaction',
    txId,
    action,
    ...restMeta,
  });

  // Escalate to warn for unexpected rollbacks or caller-flagged events.
  if (isWarn) {
    logWarn(`Transaction ${action}`, null, logMeta);
    return;
  }

  logSystemInfo(`Transaction ${action}`, logMeta);
};

// -----------------------------------------------------------------------------
// Specialized error loggers
// -----------------------------------------------------------------------------

/**
 * Logs an error from a paginated query (data + count query pair).
 *
 * @param {Error}           error      - The caught error.
 * @param {string}          dataQuery  - The data fetch query string.
 * @param {string}          countQuery - The count query string.
 * @param {unknown[]}       params     - Shared query parameters (will be masked).
 * @param {object}          [meta={}]  - Additional context.
 * @returns {void}
 */
const logPaginatedQueryError = (
  error,
  dataQuery,
  countQuery,
  params,
  meta = {}
) => {
  logError(
    error,
    null,
    withDbContext(
      buildQueryErrorMeta({ dataQuery, countQuery }, params, error, {
        context: 'paginate',
        ...meta,
      })
    )
  );
};

/**
 * Logs an error from a single-row lock operation (SELECT ... FOR UPDATE/SHARE).
 *
 * @param {Error}    error    - The caught error.
 * @param {string}   query    - The lock query string.
 * @param {unknown[]} params  - Query parameters (will be masked).
 * @param {string}   table    - Table being locked.
 * @param {string}   lockMode - Lock mode (e.g. `'FOR UPDATE'`, `'FOR SHARE'`).
 * @param {object}   [meta={}] - Additional context.
 * @returns {void}
 */
const logLockRowError = (error, query, params, table, lockMode, meta = {}) => {
  logError(
    error,
    null,
    withDbContext(
      buildQueryErrorMeta(query, params, error, {
        context: 'lock-row',
        table,
        lockMode,
        ...meta,
      })
    )
  );
};

/**
 * Logs an error from a multi-row lock operation.
 *
 * @param {Error}    error    - The caught error.
 * @param {string}   query    - The lock query string.
 * @param {unknown[]} params  - Query parameters (will be masked).
 * @param {string}   table    - Table being locked.
 * @param {object}   [meta={}] - Additional context.
 * @returns {void}
 */
const logLockRowsError = (error, query, params, table, meta = {}) => {
  logError(
    error,
    null,
    withDbContext(
      buildQueryErrorMeta(query, params, error, {
        context: 'lock-rows',
        table,
        ...meta,
      })
    )
  );
};

/**
 * Logs an error from a bulk INSERT operation.
 *
 * @param {Error}    error    - The caught error.
 * @param {string}   table    - Target table name.
 * @param {unknown[]} params  - Insert parameters (will be masked).
 * @param {number}   rowCount - Number of rows attempted.
 * @param {object}   [meta={}] - Additional context.
 * @returns {void}
 */
const logBulkInsertError = (error, table, params, rowCount, meta = {}) => {
  logError(
    error,
    null,
    withDbContext(
      buildQueryErrorMeta(`INSERT INTO ${table}`, params, error, {
        context: 'bulk-insert',
        table,
        rowCount,
        ...meta,
      })
    )
  );
};

// -----------------------------------------------------------------------------
// Exports
// -----------------------------------------------------------------------------

module.exports = {
  logDbConnect,
  logDbConnectionError,
  logDbInfo,
  logDbSlowQuery,
  logDbQueryError,
  logDbTransactionEvent,
  logPaginatedQueryError,
  logLockRowError,
  logLockRowsError,
  logBulkInsertError,
};
