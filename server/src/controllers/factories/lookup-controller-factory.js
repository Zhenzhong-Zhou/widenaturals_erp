/**
 * @file lookup-controller-factory.js
 * @description Factory for building standardized lookup controller handlers.
 *
 * Wraps a paginated lookup service into a consistent Express request handler.
 * Reads from `req.normalizedQuery` (written by `createQueryNormalizationMiddleware`)
 * and returns a uniform JSON response shape.
 */

'use strict';

const { wrapAsyncHandler } = require('../../middlewares/async-handler');

/**
 * Creates a standardized Express controller for paginated lookup endpoints.
 *
 * Reads `req.normalizedQuery` for filters, options, limit, and offset.
 * Delegates to the provided service and returns a consistent response envelope.
 *
 * Throws at **boot time** if factory inputs are invalid.
 * Throws at **request time** if `req.normalizedQuery` is absent (pipeline misconfiguration).
 *
 * @param {object}   options
 * @param {Function} options.service        - Async service function `(user, query) => { items, hasMore }`.
 * @param {string}   options.successMessage - Message included in the success response envelope.
 *
 * @returns {import('express').RequestHandler} Wrapped async Express handler.
 *
 * @throws {Error} If `service` is not a function.
 * @throws {Error} If `successMessage` is not a non-empty string.
 *
 * @example
 * const getSkuLookupController = createLookupController({
 *   service:        fetchPaginatedSkuLookupService,
 *   successMessage: 'Successfully retrieved SKU lookup',
 * });
 */
const createLookupController = ({
  service,
  successMessage,
  passUser = true,
}) => {
  // Fail fast — catch misconfiguration at startup, not per request.
  if (typeof service !== 'function') {
    throw new Error('[createLookupController] service must be a function');
  }

  if (!successMessage || typeof successMessage !== 'string') {
    throw new Error(
      '[createLookupController] successMessage must be a non-empty string'
    );
  }

  const handler = async (req, res) => {
    // req.normalizedQuery is written by createQueryNormalizationMiddleware.
    // If absent, the pipeline is misconfigured — fail loudly rather than silently falling back.
    if (!req.normalizedQuery) {
      throw new Error(
        '[createLookupController] req.normalizedQuery is undefined. ' +
          'Ensure createQueryNormalizationMiddleware runs before this controller.'
      );
    }

    const user = req.auth.user; // guaranteed by authorize middleware

    const {
      filters = {},
      options = {},
      limit = 50,
      offset = 0,
    } = req.normalizedQuery;

    // Some services don't need user (e.g. public or filter-only lookups).
    const result = passUser
      ? await service(user, { filters, options, limit, offset })
      : await service({ filters, options, limit, offset });

    // Guard against malformed service output.
    const { items = [], hasMore = false } = result || {};

    return res.status(200).json({
      success: true,
      message: successMessage,
      items,
      offset,
      limit,
      hasMore,
    });
  };

  return wrapAsyncHandler(handler);
};

module.exports = {
  createLookupController,
};
