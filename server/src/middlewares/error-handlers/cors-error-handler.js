/**
 * @file cors-error-handler.js
 * @description Middleware to handle CORS errors and respond with appropriate error messages.
 */

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
  // Check if the error is a CORS-related error
  if (err.name === 'CorsError') {
    logError(`CORS Error: ${err.message}`, {
      origin: req.headers.origin,
      method: req.method,
      url: req.originalUrl,
    });
    
    // Respond with a 403 Forbidden status for CORS issues
    return res.status(403).json({
      error: 'Forbidden: CORS policy does not allow this request.',
      details: err.message,
    });
  }
  
  // If it's not a CORS error, pass it to the next error handler
  next(err);
};

module.exports = corsErrorHandler;
