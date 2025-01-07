/**
 * @file authorization-error-handler.js
 * @description Middleware to handle authorization errors.
 */

const AppError = require('../../utils/app-error');
const { logWarn } = require('../../utils/logger-helper');

/**
 * Middleware to handle authorization errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
const authorizationErrorHandler = (err, req, res, next) => {
  if (err.name === 'AuthorizationError') {
    // Create a structured error response using AppError
    const errorResponse = new AppError(
      err.message || 'You are not authorized to perform this action.',
      403,
      {
        type: 'AuthorizationError',
        isExpected: true,
        code: 'FORBIDDEN',
        details: err.details || null, // Include additional details if provided
      }
    );
    
    // Log the authorization error as a warning
    logWarn('Authorization Error:', {
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
  
  // Pass to the next error handler if not an authorization error
  next(err);
};

module.exports = authorizationErrorHandler;
