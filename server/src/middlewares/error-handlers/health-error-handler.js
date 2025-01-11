/**
 * @file health-error-handler.js
 * @description Middleware for handling health-check specific errors.
 */

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
    // Log the health-check error as a warning
    logWarn('Health-Check Error Detected:', {
      message: err.message,
      type: err.type,
      code: err.code,
      status: err.status,
      route: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip,
    });
    
    // Return a structured 503 Service Unavailable response
    return res.status(err.status || 503).json({
      message: err.message || 'Service Unavailable',
      type: err.type || 'HealthCheckError',
      code: err.code || 'SERVICE_UNAVAILABLE',
      timestamp: new Date().toISOString(),
    });
  }
  
  // Pass to the next error handler if not a health-check specific error
  next(err);
};

module.exports = healthErrorHandler;
