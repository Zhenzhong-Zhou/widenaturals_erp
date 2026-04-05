/**
 * @file pg-error-mapper.js
 * @description Maps raw PostgreSQL error codes to structured AppError instances.
 *
 * Responsibilities:
 *   - Translate low-level PG errors into domain-safe AppError instances
 *   - Provide consistent error codes and messages for the application layer
 *   - Attach structured metadata for observability (never user-facing)
 *
 * Design:
 *   - No raw SQL or sensitive values in metadata
 *   - No sanitization here — handled by the logger layer
 *   - Uses POSTGRES_ERROR_CODES constants for all switch cases
 *   - Safe fallback for unknown or malformed error shapes
 *
 * Coverage:
 *   Class 08 — Connection exceptions
 *   Class 22 — Data exceptions
 *   Class 23 — Integrity constraint violations
 *   Class 25 — Invalid transaction state
 *   Class 28 — Invalid authorization
 *   Class 40 — Transaction rollback (serialization, deadlock)
 *   Class 42 — Syntax / schema errors
 *   Class 53 — Insufficient resources
 *   Class 57 — Operator intervention
 *   Class 58 — System errors
 */

'use strict';

const AppError = require('../AppError');
const {
  POSTGRES_ERROR_CODES,
  DB_ERROR_CODES,
} = require('../constants/db-error-constants');

// -----------------------------------------------------------------------------
// Metadata extractor
// -----------------------------------------------------------------------------

/**
 * Extracts safe, structured metadata from a raw PostgreSQL error object.
 * Never includes full SQL text or raw parameter values.
 *
 * @param {object} error - Raw PostgreSQL error.
 * @returns {{
 *   constraint?: string,
 *   table?:      string,
 *   column?:     string,
 *   schema?:     string,
 *   detail?:     string,
 *   originalCode?: string
 * }}
 */
const extractDbMeta = (error) => ({
  constraint:   error?.constraint,
  table:        error?.table,
  column:       error?.column,
  schema:       error?.schema,
  detail:       error?.detail,
  originalCode: error?.code,
});

// -----------------------------------------------------------------------------
// Mapper
// -----------------------------------------------------------------------------

/**
 * Maps a raw PostgreSQL error to a structured AppError instance.
 *
 * Returns a domain-safe AppError with the appropriate type, code, status,
 * and metadata. The returned error is ready to be thrown or forwarded via
 * next(err) — no further normalization is needed by the caller.
 *
 * Returns a generic `AppError.databaseError` for unknown or unmapped PG codes
 * so the caller always receives an AppError regardless of the PG error shape.
 *
 * @param {object | unknown} error - Raw PostgreSQL error from pg driver.
 * @returns {AppError} Normalized AppError instance.
 */
const mapPostgresError = (error) => {
  // Guard — non-object errors cannot be PG errors, return generic DB error.
  if (!error || typeof error !== 'object') {
    return AppError.databaseError('Database operation failed.', {
      code: DB_ERROR_CODES.UNKNOWN_DB_ERROR,
    });
  }
  
  const meta = extractDbMeta(error);
  
  switch (error.code) {
    
    // -------------------------------------------------------------------------
    // Class 08 — Connection exceptions
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.CONNECTION_EXCEPTION:
    case POSTGRES_ERROR_CODES.CONNECTION_DOES_NOT_EXIST:
    case POSTGRES_ERROR_CODES.CONNECTION_FAILURE:
    case POSTGRES_ERROR_CODES.SQLCLIENT_UNABLE_TO_ESTABLISH_SQLCONNECTION:
    case POSTGRES_ERROR_CODES.SQLSERVER_REJECTED_ESTABLISHMENT_OF_SQLCONNECTION:
      return AppError.databaseError('Database connection failed.', {
        code:     DB_ERROR_CODES.CONNECTION_FAILURE,
        logLevel: 'error',
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Class 22 — Data exceptions
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.NOT_NULL_VIOLATION:
      return AppError.validationError('Required field is missing.', {
        code: DB_ERROR_CODES.NOT_NULL_VIOLATION,
        meta,
      });
    
    case POSTGRES_ERROR_CODES.VALUE_TOO_LONG:
      return AppError.validationError('Value exceeds maximum allowed length.', {
        code: DB_ERROR_CODES.VALUE_TOO_LONG,
        meta,
      });
    
    case POSTGRES_ERROR_CODES.INVALID_TEXT_REPRESENTATION:
      return AppError.validationError('Invalid input format for the target column type.', {
        code: DB_ERROR_CODES.INVALID_INPUT_FORMAT,
        meta,
      });
    
    case POSTGRES_ERROR_CODES.NUMERIC_VALUE_OUT_OF_RANGE:
      return AppError.validationError('Numeric value is out of the allowed range.', {
        code: DB_ERROR_CODES.NUMERIC_OUT_OF_RANGE,
        meta,
      });
    
    case POSTGRES_ERROR_CODES.INVALID_DATETIME_FORMAT:
      return AppError.validationError('Invalid date or time format.', {
        code: DB_ERROR_CODES.INVALID_DATETIME_FORMAT,
        meta,
      });
    
    case POSTGRES_ERROR_CODES.DIVISION_BY_ZERO:
      return AppError.databaseError('Division by zero in database operation.', {
        code:     DB_ERROR_CODES.DIVISION_BY_ZERO,
        logLevel: 'error',
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Class 23 — Integrity constraint violations
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.UNIQUE_VIOLATION:
      return AppError.conflictError('A record with this value already exists.', {
        code: DB_ERROR_CODES.UNIQUE_VIOLATION,
        meta,
      });
    
    case POSTGRES_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return AppError.conflictError('Foreign key constraint violation.', {
        code: DB_ERROR_CODES.FOREIGN_KEY_VIOLATION,
        meta,
      });
    
    case POSTGRES_ERROR_CODES.CHECK_VIOLATION:
      return AppError.validationError('Value violates a database check constraint.', {
        code: DB_ERROR_CODES.CHECK_VIOLATION,
        meta,
      });
    
    case POSTGRES_ERROR_CODES.EXCLUSION_VIOLATION:
      return AppError.conflictError('Value violates an exclusion constraint.', {
        code: DB_ERROR_CODES.EXCLUSION_VIOLATION,
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Class 25 — Invalid transaction state
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.ACTIVE_SQL_TRANSACTION:
    case POSTGRES_ERROR_CODES.NO_ACTIVE_SQL_TRANSACTION:
    case POSTGRES_ERROR_CODES.IN_FAILED_SQL_TRANSACTION:
      return AppError.databaseError('Invalid transaction state.', {
        code:     DB_ERROR_CODES.INVALID_TRANSACTION_STATE,
        logLevel: 'error',
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Class 28 — Invalid authorization
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.INVALID_PASSWORD:
    case POSTGRES_ERROR_CODES.INVALID_AUTHORIZATION_SPECIFICATION:
      return AppError.databaseError('Database authorization failed.', {
        code:     DB_ERROR_CODES.AUTHORIZATION_FAILURE,
        logLevel: 'error',
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Class 40 — Transaction rollback (serialization, deadlock)
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.SERIALIZATION_FAILURE:
      return AppError.databaseError('Transaction serialization failure — safe to retry.', {
        code:     DB_ERROR_CODES.SERIALIZATION_FAILURE,
        logLevel: 'warn',
        meta,
      });
    
    case POSTGRES_ERROR_CODES.DEADLOCK_DETECTED:
      return AppError.databaseError('Deadlock detected — safe to retry.', {
        code:     DB_ERROR_CODES.DEADLOCK_DETECTED,
        logLevel: 'warn',
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Class 42 — Syntax / schema errors (always programming errors)
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.SYNTAX_ERROR:
      return AppError.databaseError('SQL syntax error.', {
        code:     DB_ERROR_CODES.SYNTAX_ERROR,
        logLevel: 'error',
        meta,
      });
    
    case POSTGRES_ERROR_CODES.UNDEFINED_TABLE:
      return AppError.databaseError('Referenced table does not exist.', {
        code:     DB_ERROR_CODES.UNDEFINED_TABLE,
        logLevel: 'error',
        meta,
      });
    
    case POSTGRES_ERROR_CODES.UNDEFINED_COLUMN:
      return AppError.databaseError('Referenced column does not exist.', {
        code:     DB_ERROR_CODES.UNDEFINED_COLUMN,
        logLevel: 'error',
        meta,
      });
    
    case POSTGRES_ERROR_CODES.UNDEFINED_FUNCTION:
      return AppError.databaseError('Referenced function does not exist.', {
        code:     DB_ERROR_CODES.UNDEFINED_FUNCTION,
        logLevel: 'error',
        meta,
      });
    
    case POSTGRES_ERROR_CODES.WRONG_OBJECT_TYPE:
      return AppError.databaseError('Wrong object type in database operation.', {
        code:     DB_ERROR_CODES.WRONG_OBJECT_TYPE,
        logLevel: 'error',
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Class 53 — Insufficient resources
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.INSUFFICIENT_RESOURCES:
    case POSTGRES_ERROR_CODES.DISK_FULL:
    case POSTGRES_ERROR_CODES.OUT_OF_MEMORY:
    case POSTGRES_ERROR_CODES.TOO_MANY_CONNECTIONS:
      return AppError.databaseError('Database resource limit reached.', {
        code:     DB_ERROR_CODES.INSUFFICIENT_RESOURCES,
        logLevel: 'error',
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Class 57 — Operator intervention
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.QUERY_CANCELED:
      return AppError.databaseError('Database query was cancelled.', {
        code:     DB_ERROR_CODES.QUERY_CANCELED,
        logLevel: 'warn',
        meta,
      });
    
    case POSTGRES_ERROR_CODES.ADMIN_SHUTDOWN:
    case POSTGRES_ERROR_CODES.CRASH_SHUTDOWN:
      return AppError.databaseError('Database server is shutting down.', {
        code:     DB_ERROR_CODES.SERVER_SHUTDOWN,
        logLevel: 'error',
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Class 58 — System errors
    // -------------------------------------------------------------------------
    
    case POSTGRES_ERROR_CODES.IO_ERROR:
    case POSTGRES_ERROR_CODES.UNDEFINED_FILE:
    case POSTGRES_ERROR_CODES.DUPLICATE_FILE:
      return AppError.databaseError('Database system I/O error.', {
        code:     DB_ERROR_CODES.IO_ERROR,
        logLevel: 'error',
        meta,
      });
    
    // -------------------------------------------------------------------------
    // Unknown / unmapped PG error code
    // -------------------------------------------------------------------------
    
    default:
      return AppError.databaseError('An unexpected database error occurred.', {
        code:     DB_ERROR_CODES.UNKNOWN_DB_ERROR,
        logLevel: 'error',
        meta,
      });
  }
};

module.exports = {
  mapPostgresError,
};
