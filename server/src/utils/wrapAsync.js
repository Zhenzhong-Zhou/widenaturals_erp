/**
 * @file wrapAsync.js
 * @description Utility for wrapping route handlers with express-async-handler.
 */

const asyncHandler = require('express-async-handler');
const { logDebug, logError } = require('../utils/loggerHelper');

/**
 * Wraps route handlers with asyncHandler for consistent error handling.
 * Supports both single functions and objects of route handlers.
 *
 * @param {Function|Object} routes - A function or an object of route handlers.
 * @param {Object} [options={}] - Optional configuration options.
 * @param {boolean} options.debug - Whether to log the wrapping process.
 * @returns {Function|Object} - Wrapped function or object with wrapped handlers.
 * @throws {Error} - Throws an error if the input is neither a function nor an object.
 */
const wrapAsync = (routes, options = { debug: false }) => {
  if (typeof routes === 'function') {
    if (options.debug) {
      logDebug(`Wrapping single route handler.`);
    }
    return asyncHandler(routes);
  }
  
  if (typeof routes !== 'object' || routes === null) {
    const error = new Error('wrapAsync expects a function or an object of route handlers');
    logError(error); // Log the error
    throw error;
  }
  
  const wrappedRoutes = {};
  Object.keys(routes).forEach((key) => {
    if (typeof routes[key] === 'function') {
      if (options.debug) {
        logDebug(`Wrapping route handler: ${key}`);
      }
      wrappedRoutes[key] = asyncHandler(routes[key]);
    } else if (typeof routes[key] === 'object' && routes[key] !== null) {
      wrappedRoutes[key] = wrapAsync(routes[key], options); // Recursively handle nested objects
    } else {
      wrappedRoutes[key] = routes[key]; // Preserve non-function values
    }
  });
  
  return wrappedRoutes;
};

module.exports = wrapAsync;
