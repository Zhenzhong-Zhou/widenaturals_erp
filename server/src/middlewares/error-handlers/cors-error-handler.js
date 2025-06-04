/**
 * @file cors-error-handler.js
 * @description Middleware to handle CORS errors and respond with appropriate error messages.
 */

const normalizeError = require('../../utils/normalize-error');
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
  const isCorsError =
    err.name === 'CorsError' || err.message?.includes('CORS policy');
  
  if (!isCorsError) return next(err);
  
  const enrichedDetails = {
    origin: req.headers.origin || 'Unknown',
    method: req.method,
    route: req.originalUrl,
  };
  
  // Normalize the error first
  const normalizedError = normalizeError(err, {
    type: 'CorsError',
    code: 'CORS_ERROR',
    isExpected: true,
    logLevel: 'warn',
    details: err.details || enrichedDetails,
  });
    
  // Log the CORS error with detailed metadata
  logError(normalizedError, req, {
    context: 'cors-error-handler',
  });

  // Respond with a structured error response
  return res.status(normalizedError.status).json(normalizedError.toJSON());
};

module.exports = corsErrorHandler;
