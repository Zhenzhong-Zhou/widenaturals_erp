/**
 * @file service-error-handler.js
 * @description Middleware to handle service-level (business logic) errors.
 */

const AppError = require('../../utils/AppError');
const { logWarn } = require('../../utils/logger-helper');

/**
 * Middleware to handle service-level errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const serviceErrorHandler = (err, req, res, next) => {
  if (err.name === 'ServiceError') {
    // Use the AppError factory method for service errors with explicit fields
    const errorResponse = AppError.serviceError(
      err.message || 'A business rule was violated.',
      {
        details: err.details || null, // Include additional details if provided
      }
    );

    // Log the service-level error with metadata
    logWarn('Service-Level Error:', {
      message: errorResponse.message,
      route: req.originalUrl,
      method: req.method,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ip: req.ip,
      details: errorResponse.details,
    });

    // Send structured error response
    return res.status(errorResponse.status).json(errorResponse.toJSON());
  }

  // Pass to the next error handler if not a service-level error
  next(err);
};

module.exports = serviceErrorHandler;
