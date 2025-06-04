/**
 * @file health-error-handler.js
 * @description Middleware for handling health-check specific errors.
 */

const normalizeError = require('../../utils/normalize-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle health-check errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const healthErrorHandler = (err, req, res, next) => {
  if (err.type === 'HealthCheckError') {
    const normalizedError = normalizeError(err, {
      type: 'HealthCheckError',
      code: err.code || 'SERVICE_UNAVAILABLE',
      status: err.status || 503,
      logLevel: 'warn',
      isExpected: true,
    });

    // Log the health-check error as a warning
    logError(normalizedError, req, {
      context: 'health-check-handler',
    });
    
    // Return a structured 503-Service Unavailable response
    return res.status(normalizedError.status).json({
      ...normalizedError.toJSON(),
      timestamp: new Date().toISOString(),
    });
  }

  // Pass to the next error handler if not a health-check specific error
  next(err); // Not a HealthCheckError, pass to the next handler
};

module.exports = healthErrorHandler;
