/**
 * @file health-error-handler.js
 * @description Middleware for handling health-check specific errors.
 */

const AppError = require('../../utils/AppError');
const { logWarn } = require('../../utils/logger-helper');

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
      }
    );

    // Log the health-check error as a warning
    logWarn('Health-Check Error Detected:', {
      message: healthError.message,
      type: healthError.type,
      code: healthError.code,
      status: healthError.status,
      route: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip,
    });

    // Return a structured 503 Service Unavailable response
    return res.status(healthError.status).json({
      ...healthError.toJSON(),
      timestamp: new Date().toISOString(),
    });
  }

  // Pass to the next error handler if not a health-check specific error
  next(err);
};

module.exports = healthErrorHandler;
