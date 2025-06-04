const normalizeError = require('./normalize-error');
const { logError } = require('./logger-helper');

/**
 * Wraps a custom error handler with normalization and logging logic.
 *
 * @param {Function} matcher - Function to check if this handler should handle the error.
 * @param {Object} defaultOptions - Fallback normalization options if the error is not an AppError.
 * @returns {Function} Express error-handling middleware.
 */
const withErrorNormalization = (matcher, defaultOptions = {}) => {
  return (err, req, res, next) => {
    if (!matcher(err)) return next(err);

    const normalized = normalizeError(err, defaultOptions);

    logError(normalized, req, {
      context: `${normalized.type?.toLowerCase()}-handler`,
    });

    res.status(normalized.status).json(normalized.toJSON());
  };
};

module.exports = withErrorNormalization;
