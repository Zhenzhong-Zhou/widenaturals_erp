/**
 * @file health-error-handler.js
 * @description Middleware for handling health-check specific errors.
 */

const AppError = require('../../utils/AppError');
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
    // Normalize to an AppError instance if not already
    const healthError = AppError.healthCheckError(
      err.message || 'Service Unavailable',
      {
        code: err.code || 'SERVICE_UNAVAILABLE',
        status: err.status || 503,
        details: err.details || null,
      }
    );

    // Log the health-check error as a warning
    logError(healthError, req, {
      context: 'health-check-handler',
    });

    // Return a structured 503-Service Unavailable response
    return res.status(healthError.status).json({
      ...healthError.toJSON(),
      timestamp: new Date().toISOString(),
    });
  }

  // Pass to the next error handler if not a health-check specific error
  next(err); // Not a HealthCheckError, pass to the next handler
};

module.exports = healthErrorHandler;
