/**
 * @file db-logger.js
 * @description Utility functions for logging database events such as queries and errors.
 */

const { logSystemInfo, logSystemException } = require('./system-logger');
const { logInfo, logWarn, logError, createSystemMeta } = require('./logger-helper');
const { maskSensitiveParams } = require('./mask-logger-params');

/**
 * Logs a successful database connection event using system-level logging.
 *
 * Intended to be used inside connection lifecycle hooks (e.g., pool.on('connect'))
 * to confirm that the application has established a database connection.
 *
 * Adds standardized system metadata and includes the logging context.
 *
 * @example
 * pool.on('connect', logDbConnect);
 */
const logDbConnect = () => {
  logSystemInfo('Connected to the database', { context: 'database' });
};

/**
 * Logs a fatal database connection error using standardized system logging.
 *
 * This should be used in cases where the application encounters an unexpected
 * database error that may affect core functionality (e.g., pool.on('error')).
 * It includes the error message, stack trace (if enabled), and context.
 *
 * @param {Error} error - The error object caught during the database event.
 *
 * @example
 * pool.on('error', (err) => {
 *   logDbError(err);
 *   throw AppError.databaseError('Unexpected database connection error', { details: { error: err } });
 * });
 */
const logDbError = (error) => {
  logSystemException(error, 'Database connection error', {
    context: 'database',
    severity: 'critical',
  });
};

/**
 * Logs a retry attempt failure with exponential backoff info.
 *
 * @param {number} attempt - The current retry attempt number.
 * @param {number} retries - Total allowed retries.
 * @param {Error} error - The caught error.
 * @param {number} nextDelayMs - The delay (in ms) before the next attempt.
 */
const logRetryWarning = (attempt, retries, error, nextDelayMs) => {
  logWarn(`Retry ${attempt}/${retries} failed`, null, {
    ...createSystemMeta(),
    errorMessage: error.message,
    attempt,
    retries,
    nextDelayMs,
    context: 'retry',
  });
};

/**
 * Builds standardized metadata for query logging, combining system context,
 * masked query parameters, and execution duration.
 *
 * @param {string} query - The SQL query string.
 * @param {Array|Object} params - Query parameters (masked internally).
 * @param {number} durationMs - Execution time in milliseconds.
 * @param {Object} [extraMeta={}] - Optional additional metadata.
 * @returns {Object} Structured metadata for logging.
 */
const buildQueryMeta = (query, params, durationMs, extraMeta = {}) => ({
  ...createSystemMeta(),
  query,
  params: maskSensitiveParams(params),
  durationMs,
  ...extraMeta,
});

/**
 * Builds standardized metadata for failed query logs, including masked parameters and error context.
 *
 * @param {string|Object} query - SQL query string or an object like { dataQuery, countQuery }.
 * @param {Array|Object} params - Query parameters.
 * @param {Error} error - The thrown error.
 * @param {Object} extraMeta - Any additional metadata (context, page, limit, etc.).
 * @returns {Object} - Structured metadata for logging.
 */
const buildQueryErrorMeta = (query, params, error, extraMeta = {}) => ({
  ...createSystemMeta(),
  ...(typeof query === 'string' ? { query } : query), // supports { dataQuery, countQuery }
  params: maskSensitiveParams(params),
  errorMessage: error.message,
  stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
  ...extraMeta,
});

/**
 * Logs a successful query execution.
 *
 * @param {string} text - The SQL query.
 * @param {Array|Object} params - Query parameters.
 * @param {number} duration - Execution time in ms.
 * @param {Object} [meta={}] - Optional metadata (e.g., traceId, txId, context).
 */
const logDbQuerySuccess = (text, params, duration, meta = {}) => {
  logInfo('Query executed', null, buildQueryMeta(text, params, duration, {
    status: 'success',
    ...meta,
  }));
};

/**
 * Logs a slow query warning.
 *
 * @param {string} text - The query text.
 * @param {Array|Object} params - Query parameters.
 * @param {number} duration - Execution time in ms.
 * @param {Object} [meta={}] - Optional metadata (e.g., traceId, txId, context).
 */
const logDbSlowQuery = (text, params, duration, meta = {}) => {
  logWarn('Slow query detected', null, buildQueryMeta(text, params, duration, {
    severity: 'slow',
    ...meta,
  }));
};

/**
 * Logs a database query failure using structured metadata.
 *
 * @param {string|Object} query - A single SQL string or an object with multiple queries (e.g., { dataQuery, countQuery }).
 * @param {Array|Object} params - Parameters for the query/queries.
 * @param {Error} error - The thrown error.
 * @param {Object} [extraMeta={}] - Optional additional log metadata.
 */
const logDbQueryError = (query, params, error, extraMeta = {}) => {
  const meta = buildQueryErrorMeta(query, params, error, {
    severity: 'critical',
    ...extraMeta,
  });
  
  logError('Query execution failed', null, meta);
};

/**
 * Logs a database transaction lifecycle event (e.g., BEGIN, COMMIT, ROLLBACK).
 *
 * @param {'BEGIN'|'COMMIT'|'ROLLBACK'|'SAVEPOINT'|'RELEASE'} action - The transaction action.
 * @param {string} txId - Unique identifier for this transaction.
 * @param {Object} [extraMeta={}] - Optional additional metadata.
 */
const logDbTransactionEvent = (action, txId, extraMeta = {}) => {
  logInfo(`Transaction ${action}`, null, {
    ...createSystemMeta(),
    txId,
    action,
    context: 'transaction',
    ...extraMeta,
  });
};

/**
 * Logs current pool statistics as a system event.
 *
 * @param {object} metrics - The pool metrics (e.g., total, idle, waiting).
 */
const logDbPoolHealth = (metrics) => {
  logSystemInfo('Pool health metrics', {
    context: 'pool-monitor',
    ...metrics,
  });
};

/**
 * Logs pool health monitoring failure.
 *
 * @param {Error} error - The error encountered during monitoring.
 */
const logDbPoolHealthError = (error) => {
  logSystemException(error, 'Error during pool monitoring', {
    context: 'pool-monitor',
    severity: 'warning',
  });
};

/**
 * Logs a paginated query failure using structured metadata.
 *
 * @param {Error} error - The thrown error object.
 * @param {string} dataQuery - The main SQL query.
 * @param {string} countQuery - The COUNT(*) SQL query.
 * @param {Array|Object} params - Query parameters.
 * @param {Object} [extraMeta={}] - Optional metadata (e.g., page, limit, traceId).
 */
const logPaginatedQueryError = (
  error,
  dataQuery,
  countQuery,
  params,
  extraMeta = {}
) => {
  const logMeta = buildQueryErrorMeta(
    { dataQuery, countQuery },
    params,
    error,
    {
      context: 'paginate-results',
      ...extraMeta,
    }
  );
  
  logError('Paginated query execution failed', null, logMeta);
};

/**
 * Logs a database row lock failure using structured metadata.
 *
 * @param {Error} error - The caught error object.
 * @param {string} query - The SQL locking query attempted.
 * @param {Array|Object} params - Query parameters (masked internally).
 * @param {string} table - The table involved (masked if needed).
 * @param {string} lockMode - The lock mode used (e.g., 'FOR UPDATE').
 * @param {Object} [extraMeta={}] - Optional metadata (e.g., traceId, txId, context override).
 */
const logLockRowError = (error, query, params, table, lockMode, extraMeta = {}) => {
  const logMeta = buildQueryErrorMeta(query, params, error, {
    context: 'lock-row',
    table,
    lockMode,
    errorType: error.name,
    ...extraMeta,
  });
  
  logError('Failed to lock row', null, logMeta);
};

/**
 * Logs a failure when attempting to lock multiple rows (e.g., composite key locking).
 *
 * @param {Error} error - The caught error.
 * @param {string} query - The generated SQL query.
 * @param {Array|Object} params - Parameters used in the query (masked internally).
 * @param {string} table - The masked table name.
 * @param {Object} [meta={}] - Optional additional metadata.
 * @param {string} [meta.traceId] - Trace identifier for request tracing.
 * @param {string} [meta.txId] - Transaction ID, if applicable.
 * @param {string} [meta.context] - Optional override for logging context.
 */
const logLockRowsError = (error, query, params, table, meta = {}) => {
  const logMeta = buildQueryErrorMeta(query, params, error, {
    context: 'lock-rows',
    table,
    ...meta,
  });
  
  logError(`Error locking rows in table ${table}`, null, logMeta);
};

/**
 * Logs a structured error for a failed bulk insert operation.
 *
 * @param {Error} error - The caught error object.
 * @param {string} table - The masked table name where the insert was attempted.
 * @param {string[]} columns - List of columns targeted by the insert.
 * @param {string[]} conflictColumns - Columns used in the ON CONFLICT clause.
 * @param {string[]} updateColumns - Columns targeted by DO UPDATE (if any).
 * @param {Array} flattenedValues - The flattened parameter values for the insert.
 * @param {number} rowCount - Number of rows attempted to insert.
 * @param {Object} [meta={}] - Optional additional metadata (e.g., traceId, txId).
 * @param {string} [meta.traceId] - Request-scoped trace ID.
 * @param {string} [meta.txId] - Transaction ID, if applicable.
 * @param {string} [meta.context] - Optional context override (default is 'bulk-insert').
 */
const logBulkInsertError = (
  error,
  table,
  columns,
  conflictColumns,
  updateColumns,
  flattenedValues,
  rowCount,
  meta = {}
) => {
  const logMeta = buildQueryErrorMeta('INSERT INTO ' + table, flattenedValues, error, {
    context: 'bulk-insert',
    table,
    columns,
    conflictColumns,
    updateColumns,
    rowCount,
    ...meta,
  });
  
  logError('Bulk insert failed', null, logMeta);
};

/**
 * Logs a failure when fetching a status value from a table.
 *
 * @param {Error} error - The caught error.
 * @param {string} query - The SQL query executed.
 * @param {string} table - The masked table name.
 * @param {string} column - The column being selected.
 * @param {*} whereValue - The value used in the WHERE clause.
 * @param {string} whereKey - The column name used in the WHERE clause.
 * @param {Object} [meta={}] - Optional extra metadata (e.g., traceId, txId).
 */
const logGetStatusValueError = (
  error,
  query,
  table,
  column,
  whereValue,
  whereKey,
  meta = {}
) => {
  const logMeta = buildQueryErrorMeta(query, { [whereKey]: whereValue }, error, {
    context: 'get-status-value',
    table,
    column,
    where: { [whereKey]: maskSensitiveParams(whereValue) },
    ...meta,
  });
  
  logError(`Failed to fetch "${column}" from "${table}"`, null, logMeta);
};

module.exports = {
  logDbConnect,
  logDbError,
  logRetryWarning,
  logDbQuerySuccess,
  logDbSlowQuery,
  logDbQueryError,
  logDbTransactionEvent,
  logDbPoolHealth,
  logDbPoolHealthError,
  logPaginatedQueryError,
  logLockRowError,
  logLockRowsError,
  logBulkInsertError,
  logGetStatusValueError,
};
