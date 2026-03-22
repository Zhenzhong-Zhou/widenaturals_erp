/**
 * @file db-logger.js
 * @description Database-level logging utilities (low-noise, production-safe).
 *
 * Responsibilities:
 * - Log ONLY meaningful DB events (errors, slow queries, system health)
 * - Avoid high-frequency noise (e.g., query success)
 * - Ensure all logs include system/database context
 *
 * Design:
 * - No request context (DB layer ≠ request layer)
 * - Uses system logger for infra-level events
 * - Uses logError for ALL error normalization
 */

const {
  logSystemInfo,
  logSystemException,
} = require('./logging/system-logger');
const {
  logWarn,
  logError,
} = require('./logging/logger-helper');
const { maskSensitiveParams } = require('./masking/mask-sensitive-params');

// ============================================================
// Context helper
// ============================================================

const withDbContext = (meta = {}) => ({
  traceId: 'system',
  layer: 'database',
  ...meta,
});

// ============================================================
// Connection
// ============================================================

const logDbConnect = () => {
  logSystemInfo('Database connected', {
    context: 'database',
  });
};

const logDbError = (error) => {
  logSystemException(error, 'Database connection error', {
    context: 'database',
    crash: true,
  });
};

// ============================================================
// Query helpers
// ============================================================

const truncateQuery = (query) =>
  typeof query === 'string' && query.length > 500
    ? query.slice(0, 500) + '...[truncated]'
    : query;

const buildQueryMeta = (query, params, durationMs, extraMeta = {}) => ({
  query: truncateQuery(query),
  params: maskSensitiveParams(params),
  durationMs,
  ...extraMeta,
});

const buildQueryErrorMeta = (query, params, error, extraMeta = {}) => ({
  query: truncateQuery(query),
  params: maskSensitiveParams(params),
  errorName: error.name,
  errorMessage: error.message,
  ...(process.env.NODE_ENV !== 'production'
    ? { stack: error.stack }
    : {}),
  ...extraMeta,
});

// ============================================================
// Query logging (LOW NOISE)
// ============================================================

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

const logDbQueryError = (query, params, error, meta = {}) => {
  logError(error, null, withDbContext(
    buildQueryErrorMeta(query, params, error, {
      ...meta,
    })
  ));
};

// ============================================================
// Transactions (optional, low frequency)
// ============================================================

const logDbTransactionEvent = (action, txId, meta = {}) => {
  logWarn(
    `Transaction ${action}`,
    null,
    withDbContext({
      context: 'transaction',
      txId,
      action,
      ...meta,
    })
  );
};

// ============================================================
// Pool health (system-level)
// ============================================================

const logDbPoolHealth = (metrics) => {
  logSystemInfo('DB pool health', {
    context: 'pool-monitor',
    ...metrics,
  });
};

// ============================================================
// Specialized errors
// ============================================================

const logPaginatedQueryError = (
  error,
  dataQuery,
  countQuery,
  params,
  meta = {}
) => {
  logError(error, null, withDbContext(
    buildQueryErrorMeta(
      { dataQuery, countQuery },
      params,
      error,
      {
        context: 'paginate',
        ...meta,
      }
    )
  ));
};

const logLockRowError = (
  error,
  query,
  params,
  table,
  lockMode,
  meta = {}
) => {
  logError(error, null, withDbContext(
    buildQueryErrorMeta(query, params, error, {
      context: 'lock-row',
      table,
      lockMode,
      ...meta,
    })
  ));
};

const logLockRowsError = (error, query, params, table, meta = {}) => {
  logError(error, null, withDbContext(
    buildQueryErrorMeta(query, params, error, {
      context: 'lock-rows',
      table,
      ...meta,
    })
  ));
};

const logBulkInsertError = (
  error,
  table,
  params,
  rowCount,
  meta = {}
) => {
  logError(error, null, withDbContext(
    buildQueryErrorMeta(`INSERT INTO ${table}`, params, error, {
      context: 'bulk-insert',
      table,
      rowCount,
      ...meta,
    })
  ));
};

module.exports = {
  logDbConnect,
  logDbError,
  logDbSlowQuery,
  logDbQueryError,
  logDbTransactionEvent,
  logDbPoolHealth,
  logPaginatedQueryError,
  logLockRowError,
  logLockRowsError,
  logBulkInsertError,
};
