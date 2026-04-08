const AppError = require('../AppError');
const { mapPostgresError } = require('./pg-error-mapper');

/**
 * Centralized database error handler
 *
 * Responsibilities:
 * - Preserve AppError (no re-wrap)
 * - Extract PostgreSQL metadata
 * - Log raw DB error (optional)
 * - Map PG errors → AppError
 * - Attach metadata + cause
 * - Log final structured error
 */
const handleDbError = (
  error,
  {
    context,
    meta = {},
    message = 'Database operation failed',
    logFn,        // final structured log
    rawLogFn,     // raw PG log (optional)
    suppressThrow = false,
  } = {}
) => {
  //--------------------------------------------------
  // 1. Preserve AppError (DO NOT TOUCH)
  //--------------------------------------------------
  if (error instanceof AppError) {
    logFn?.(error);
    if (!suppressThrow) throw error;
    return error;
  }
  
  //--------------------------------------------------
  // 2. Extract PG metadata safely
  //--------------------------------------------------
  const isPgError = typeof error?.code === 'string';
  
  const pgMeta = isPgError
    ? {
      pgCode: error.code,
      detail: error.detail,
      constraint: error.constraint,
      table: error.table,
      schema: error.schema,
    }
    : {};
  
  //--------------------------------------------------
  // 3. Log RAW error (optional)
  //--------------------------------------------------
  rawLogFn?.({
    message: 'Raw Postgres error',
    context,
    error: error.message,
    ...pgMeta,
  });
  
  //--------------------------------------------------
  // 4. Map PG error → AppError
  //--------------------------------------------------
  const mappedError = mapPostgresError(error);
  
  //--------------------------------------------------
  // 5. Build FINAL error (immutable)
  //--------------------------------------------------
  const finalError = mappedError
    ? AppError.from(mappedError, {
      meta: {
        ...(mappedError.meta || {}),
        ...meta,
        ...pgMeta,
      },
      cause: error,
    })
    : AppError.databaseError(message, {
      context,
      meta: {
        ...meta,
        ...pgMeta,
      },
      cause: error,
    });
  
  //--------------------------------------------------
  // 6. Log FINAL error
  //--------------------------------------------------
  logFn?.(finalError);
  
  //--------------------------------------------------
  // 7. Throw / return
  //--------------------------------------------------
  if (!suppressThrow) throw finalError;
  
  return finalError;
};

module.exports = {
  handleDbError,
};
