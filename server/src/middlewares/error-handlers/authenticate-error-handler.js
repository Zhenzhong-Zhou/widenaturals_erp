/**
 * @file authenticate-error-handler.js
 * @description Middleware for handling authentication errors.
 */

const normalizeError = require('../../utils/normalize-error');
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
    // Normalize the incoming error
    const normalizedError = normalizeError(err, {
      isExpected: true,
      type: err.type || 'AuthenticationError',
      code: err.code || 'AUTHENTICATION_ERROR',
      logLevel: err.logLevel || 'warn', // Use the original log level if available
      ...err, // Include other properties like `code` or `details`
    });
  
  // Check if it's an authentication-related error
  const isAuthError =
    [
      'AuthenticationError',
      'AccessTokenExpiredError',
      'AccessTokenError',
      'RefreshTokenExpiredError',
      'RefreshTokenError',
      'TokenRevokedError',
    ].includes(normalizedError.type) ||
    normalizedError.code === 'AUTHENTICATION_ERROR' ||
    normalizedError.name === 'UnauthorizedError';
  
  if (isAuthError) {
    // Define custom messages for specific error types
    const errorMessages = {
      AccessTokenExpiredError:
        'Access token expired. Please use your refresh token.',
      AccessTokenError: 'Access token is missing or invalid.',
      RefreshTokenExpiredError: 'Refresh token expired. Please log in again.',
      RefreshTokenError: 'Refresh token is missing or invalid.',
      TokenRevokedError: 'Token has been revoked. Please log in again.',
    };
    
    // Override the message if a more specific one exists
    normalizedError.message =
      errorMessages[normalizedError.type] || normalizedError.message;
    
    
    // Log and return the error
    logError(normalizedError, req, {
      context: 'auth-error-handler',
      stage: 'token-validation',
    });
    
    // Send a structured error response
    return res.status(normalizedError.status).json(normalizedError.toJSON());
  }

  // Pass the error to the next middleware if it's not an authentication error
  next(err);
};

module.exports = authenticateErrorHandler;
