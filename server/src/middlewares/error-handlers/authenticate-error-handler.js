/**
 * @file authenticate-error-handler.js
 * @description Middleware for handling authentication errors.
 */

const AppError = require('../../utils/app-error');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware for handling authentication errors.
 * Logs unauthorized access attempts and sends a structured error response.
 *
 * @param {Error} err - The error object caught by middleware.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object.
 * @param {Function} next - The Express next middleware function.
 */
const authenticateErrorHandler = (err, req, res, next) => {
  if (err.name === 'UnauthorizedError' || err.code === 'UNAUTHORIZED') {
    // Create a structured AppError for authentication violations
    const authError = new AppError('Unauthorized access', 401, {
      type: 'AuthenticationError',
      isExpected: true, // Authentication errors are expected in certain scenarios
      code: 'UNAUTHORIZED_ACCESS',
    });
    
    // Log the authentication error with detailed metadata
    logError('Authentication Error', {
      message: authError.message,
      route: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || 'Unknown',
    });
    
    // Respond with a structured error response
    return res.status(authError.status).json(authError.toJSON());
  }
  
  // Pass the error to the next middleware if it's not an authentication error
  next(err);
};

module.exports = authenticateErrorHandler;
