/**
 * @file cors-error-handler.js
 * @description Middleware to handle CORS errors and respond with appropriate error messages.
 */

const AppError = require('../../utils/AppError');
const { logError } = require('../../utils/logger-helper');

/**
 * Middleware to handle CORS errors.
 *
 * @param {Error} err - The error object.
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The Express next middleware function.
 */
const corsErrorHandler = (err, req, res, next) => {
  // Check if the error is CORS-related
  if (err.name === 'CorsError' || err.message.includes('CORS policy')) {
    // Use the AppError factory method for CORS violations
    const corsError = AppError.corsError(
      'CORS policy does not allow this request.',
      {
        details: {
          origin: req.headers.origin || 'Unknown',
          method: req.method,
          route: req.originalUrl,
        },
        logLevel: 'warn',
      }
    );

    // Log the CORS error with detailed metadata
    logError(corsError.logLevel, 'CORS Error:', {
      message: corsError.message,
      origin: req.headers.origin || 'Unknown',
      method: req.method,
      route: req.originalUrl,
      userAgent: req.headers['user-agent'] || 'Unknown',
    });

    // Respond with a structured error response
    return res.status(corsError.status).json(corsError.toJSON());
  }

  // If it's not a CORS error, pass it to the next middleware
  next(err);
};

module.exports = corsErrorHandler;
