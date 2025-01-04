/**
 * @file wrapAsync.js
 * @description Utility for wrapping route handlers with express-async-handler.
 */

const asyncHandler = require('express-async-handler');
const { logDebug, logError } = require('../utils/loggerHelper');

/**
 * Recursively wraps all route handlers in asyncHandler for consistent error handling.
 * Uses loggerHelper for optional debug logging during the wrapping process.
 *
 * @param {Object} routes - Object containing route handlers.
 * @param {Object} [options={}] - Optional configuration options.
 * @param {boolean} options.debug - Whether to log the wrapping process.
 * @returns {Object} - New object with wrapped route handlers.
 * @throws {Error} - Throws an error if the input is not a valid object.
 */
const wrapAsync = (routes, options = { debug: false }) => {
  if (typeof routes !== 'object' || routes === null) {
    const error = new Error('wrapAsync expects an object of route handlers');
    logError(error); // Log the error
    throw error;
  }
  
  const wrappedRoutes = {};
  
  Object.keys(routes).forEach((key) => {
    if (typeof routes[key] === 'function') {
      if (options.debug) {
        logDebug(`Wrapping route handler: ${key}`);
      }
      wrappedRoutes[key] =
        routes[key].constructor.name === 'AsyncFunction'
          ? asyncHandler(routes[key])
          : routes[key];
    } else if (typeof routes[key] === 'object' && routes[key] !== null) {
      wrappedRoutes[key] = wrapAsync(routes[key], options); // Recursively handle nested objects
    } else {
      wrappedRoutes[key] = routes[key]; // Preserve non-function values
    }
  });
  
  return wrappedRoutes;
};

module.exports = wrapAsync;
