/**
 * @file async-handler.js
 * @description Express middleware wrapper for async route handlers.
 */

const asyncHandler = require('express-async-handler');

/**
 * Wraps an Express route handler to ensure async errors
 * are properly propagated to the global error handler.
 *
 * Eliminates the need for repetitive try/catch blocks
 * in controller functions.
 *
 * @param {import('express').RequestHandler} fn - Route handler (async or sync)
 * @returns {import('express').RequestHandler}
 */
const wrapAsyncHandler = (fn) => {
  if (typeof fn !== 'function') {
    throw new TypeError(
      `wrapAsyncHandler expected a function, received ${typeof fn}`
    );
  }
  
  return asyncHandler(
    /** @type {(req: any, res: any, next: any) => Promise<void>} */
    (async (req, res, next) => {
      await fn(req, res, next);
    })
  );
};

module.exports = {
  wrapAsyncHandler,
};
