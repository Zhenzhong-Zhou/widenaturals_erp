/**
 * @file wrapAsync.js
 * @description Utility for wrapping route handlers with express-async-handler.
 */

const asyncHandler = require('express-async-handler');
const AppError = require('../utils/app-error');
const { logDebug, logError } = require('./logger-helper');

/**
 * Recursively wraps route handlers with asyncHandler for consistent error handling.
 * Supports single functions, objects, or nested objects of route handlers.
 *
 * @param {Function|Object} routes - A function or an object of route handlers.
 * @param {Object} [options={}] - Optional configuration options.
 * @param {boolean} [options.debug=false] - Whether to log the wrapping process.
 * @returns {Function|Object} - Wrapped function or object with wrapped handlers.
 * @throws {AppError} - Throws an AppError if the input is neither a function nor an object.
 */
const wrapAsync = (routes, options = { debug: false }) => {
  if (typeof routes === 'function') {
    if (options.debug) {
      logDebug(`Wrapping single route handler.`);
    }
    return asyncHandler(routes);
  }
  
  if (typeof routes !== 'object' || routes === null) {
    const error = new AppError(
      'wrapAsync expects a function or an object of route handlers',
      500,
      {
        type: 'InvalidInputError',
        details: { providedType: typeof routes },
        isExpected: false,
      }
    );
    logError('Invalid input to wrapAsync:', error.toJSON());
    throw error;
  }
  
  return Object.entries(routes).reduce((wrappedRoutes, [key, value]) => {
    if (typeof value === 'function') {
      if (options.debug) {
        logDebug(`Wrapping route handler: ${key}`);
      }
      wrappedRoutes[key] = asyncHandler(value);
    } else if (typeof value === 'object' && value !== null) {
      wrappedRoutes[key] = wrapAsync(value, options); // Recursively wrap nested objects
    } else {
      wrappedRoutes[key] = value; // Preserve non-function values
    }
    return wrappedRoutes;
  }, {});
};

module.exports = wrapAsync;
