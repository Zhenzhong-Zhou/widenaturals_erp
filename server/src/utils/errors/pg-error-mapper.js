const AppError = require('../AppError');
const { DB_ERROR_CODES } = require('../constants/error-constants');

/**
 * Extracts safe metadata from a PostgreSQL error.
 *
 * NOTE:
 * - Do NOT include full SQL or sensitive values
 * - Keep metadata minimal and structured
 *
 * @param {any} error
 * @returns {Object}
 */
const extractDbMeta = (error) => ({
  constraint: error?.constraint,
  table: error?.table,
  column: error?.column,
  originalCode: error?.code,
});

/**
 * Maps PostgreSQL error codes to structured AppError instances.
 *
 * Responsibilities:
 * - Translate low-level DB errors into domain-safe errors
 * - Provide consistent error codes and messages
 * - Attach structured metadata for logging (not user-facing)
 *
 * Design:
 * - No sanitization here (handled by logger layer)
 * - No raw SQL leakage
 * - Safe fallback for unknown error shapes
 *
 * @param {any} error - Raw PostgreSQL error
 * @returns {AppError}
 */
const mapPostgresError = (error) => {
  // Fallback if not a PostgreSQL error
  if (!error || typeof error !== 'object') {
    return AppError.databaseError('Database operation failed', {
      code: DB_ERROR_CODES.UNKNOWN_DB_ERROR,
    });
  }
  
  const meta = extractDbMeta(error);
  
  switch (error.code) {
    case '23505': // unique_violation
      return AppError.conflictError('Duplicate entry', {
        code: DB_ERROR_CODES.UNIQUE_VIOLATION,
        meta,
      });
    
    case '23503': // foreign_key_violation
      return AppError.conflictError('Foreign key constraint failed', {
        code: DB_ERROR_CODES.FOREIGN_KEY_VIOLATION,
        meta,
      });
    
    case '23502': // not_null_violation
      return AppError.validationError('Required field missing', {
        code: DB_ERROR_CODES.NOT_NULL_VIOLATION,
        meta,
      });
    
    case '22001': // string_data_right_truncation
      return AppError.validationError('Value too long for column', {
        code: DB_ERROR_CODES.VALUE_TOO_LONG,
        meta,
      });
    
    case '22P02': // invalid_text_representation
      return AppError.validationError('Invalid input format', {
        code: DB_ERROR_CODES.INVALID_INPUT_FORMAT,
        meta,
      });
    
    case '40001': // serialization_failure
      return AppError.databaseError('Transaction serialization failure', {
        code: DB_ERROR_CODES.SERIALIZATION_FAILURE,
        logLevel: 'warn',
        meta,
      });
    
    case '40P01': // deadlock_detected
      return AppError.databaseError('Deadlock detected', {
        code: DB_ERROR_CODES.DEADLOCK_DETECTED,
        logLevel: 'warn',
        meta,
      });
    
    default:
      return AppError.databaseError('Database operation failed', {
        code: DB_ERROR_CODES.UNKNOWN_DB_ERROR,
        meta,
      });
  }
};

module.exports = {
  mapPostgresError,
};
