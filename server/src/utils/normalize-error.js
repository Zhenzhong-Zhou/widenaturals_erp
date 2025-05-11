const AppError = require('./AppError');

/**
 * Ensures all errors are wrapped as AppError instances.
 *
 * @param {any} err - Original error object
 * @param {object} [fallbackOptions={}] - Options to apply if conversion is needed
 * @returns {AppError}
 */
const normalizeError = (err, fallbackOptions = {}) => {
  if (err instanceof AppError) return err;
  
  const message = err.message || 'An unexpected error occurred.';
  return AppError.generalError(message, {
    status: err.status || 500,
    ...fallbackOptions,
  });
};

module.exports = normalizeError;
