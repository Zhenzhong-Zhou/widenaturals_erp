const AppError = require('./AppError');
const { ERROR_TYPES, ERROR_CODES } = require('./constants/error-constants');

/**
 * Ensures all errors are wrapped as AppError instances.
 *
 * @param {any} err - Original error object
 * @param {object} [fallbackOptions={}] - Options to apply if conversion is needed
 * @returns {AppError}
 */
// todo: delete
const normalizeError = (err, fallbackOptions = {}) => {
  // Already normalized
  if (err instanceof AppError) return err;
  
  // Safe message extraction
  const message =
    (err && typeof err === 'object' && err.message) ||
    (typeof err === 'string' ? err : null) ||
    'An unexpected error occurred.';
  
  // Extract status safely
  const status =
    (err && typeof err === 'object' && err.status) || 500;
  
  // Build structured meta (VERY important)
  const meta = {
    originalErrorMessage: err?.message,
    originalErrorName: err?.name,
  };
  
  // Use correct constructor signature
  return new AppError(
    message,
    status,
    AppError.buildOptions(
      {
        type: ERROR_TYPES.GENERAL,
        code: ERROR_CODES.GENERAL,
        logLevel: 'error',
        isExpected: false,
      },
      {
        meta,
        ...fallbackOptions,
      }
    )
  );
};

module.exports = normalizeError;
