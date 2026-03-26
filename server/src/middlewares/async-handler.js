/**
 * @file async-handler.js
 * @description Wraps async Express route handlers so that any thrown error or
 * rejected promise is forwarded to the next error-handling middleware instead
 * of causing an unhandled rejection.
 *
 * Eliminates repetitive try/catch blocks in controllers. Works with both
 * async and sync handlers — sync handlers that throw are caught the same way.
 *
 * Usage:
 *   router.get('/items', wrapAsyncHandler(listItemsController));
 */

'use strict';

/**
 * Wraps an Express route handler to forward any thrown error or rejected
 * promise to `next()`, routing it to the global error handler pipeline.
 *
 * @param {import('express').RequestHandler} fn - Async or sync route handler.
 * @returns {import('express').RequestHandler}
 * @throws {TypeError} At call time if `fn` is not a function.
 *
 * @example
 * router.get('/skus', wrapAsyncHandler(getSkuLookupController));
 */
const wrapAsyncHandler = (fn) => {
  if (typeof fn !== 'function') {
    throw new TypeError(
      `wrapAsyncHandler expected a function, received: ${typeof fn}`
    );
  }
  
  // Return a standard Express handler. Promise.resolve() handles both async
  // functions (which return a promise) and sync functions (which return a
  // plain value) uniformly — any rejection or throw routes to next(err).
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  wrapAsyncHandler
};
