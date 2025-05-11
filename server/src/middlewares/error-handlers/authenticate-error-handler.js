/**
 * @file authenticate-error-handler.js
 * @description Middleware for handling authentication errors.
 */

const AppError = require('../../utils/AppError');
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
  // Check if the error is related to authentication
  if (
    err.type === 'AuthenticationError' ||
    err.type === 'AccessTokenExpiredError' ||
    err.type === 'AccessTokenError' ||
    err.type === 'RefreshTokenExpiredError' ||
    err.type === 'RefreshTokenError' ||
    err.type === 'TokenRevokedError' ||
    err.code === 'AUTHENTICATION_ERROR' ||
    err.name === 'UnauthorizedError'
  ) {
    // Define custom messages for specific error types
    const errorMessages = {
      AccessTokenExpiredError:
        'Access token expired. Please use your refresh token.',
      AccessTokenError: 'Access token is missing or invalid.',
      RefreshTokenExpiredError: 'Refresh token expired. Please log in again.',
      RefreshTokenError: 'Refresh token is missing or invalid.',
      TokenRevokedError: 'Token has been revoked. Please log in again.',
    };

    // Use the specific message or default to the error's message
    const message = errorMessages[err.type] || err.message;

    // Create the custom authentication error
    const authError = AppError.authenticationError(message, {
      isExpected: true,
      type: err.type || 'AuthenticationError',
      code: err.code || 'AUTHENTICATION_ERROR',
      logLevel: err.logLevel || 'warn', // Use the original log level if available
      ...err, // Include other properties like `code` or `details`
    });

    // Log the error with metadata
    logError(authError, req, {
      context: 'auth-error-handler',
      stage: 'token-validation',
    });

    // Send a structured error response
    return res.status(authError.status).json(authError.toJSON());
  }

  // Pass the error to the next middleware if it's not an authentication error
  next(err);
};

module.exports = authenticateErrorHandler;
