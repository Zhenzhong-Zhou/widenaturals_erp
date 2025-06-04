/**
 * @file wrapAsync.js
 * @description Utility for wrapping route handlers with express-async-handler.
 */

const asyncHandler = require('express-async-handler');
const normalizeError = require('./normalize-error');
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
      logDebug('Wrapping single route handler.', null, {
        context: 'wrapAsync',
      });
    }
    return asyncHandler(routes);
  }
  
  if (typeof routes !== 'object' || routes === null) {
    const error = normalizeError(
      new Error('wrapAsync expects a function or an object of route handlers'),
      {
        type: 'InvalidInputError',
        code: 'WRAP_ASYNC_TYPE_ERROR',
        isExpected: false,
        details: { providedType: typeof routes },
      }
    );
    logError(error, null, { context: 'wrapAsync' });
    throw error;
  }

  return Object.entries(routes).reduce((wrappedRoutes, [key, value]) => {
    if (typeof value === 'function') {
      if (options.debug) {
        logDebug(`Wrapping route handler: ${key}`, null, {
          context: 'wrapAsync',
        });
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
