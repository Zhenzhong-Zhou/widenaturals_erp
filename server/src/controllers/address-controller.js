/**
 * @file address-controller.js
 * @module controllers/address-controller
 *
 * @description
 * Controllers for the Address resource.
 *
 * Routes:
 *   POST /api/v1/addresses          → createAddressController
 *   GET  /api/v1/addresses          → getPaginatedAddressesController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId, pagination,
 *   sorting, filters) are emitted automatically by the global request-logger
 *   middleware via res.on('finish'). No controller-level logging needed.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  createAddressService,
  fetchPaginatedAddressesService,
} = require('../services/address-service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/addresses
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates one or more address records.
 *
 * Accepts a JSON array in req.body for single or bulk insertion.
 * Returns a single object for one address, or an array for bulk.
 *
 * Requires: auth middleware, Joi body validation, CREATE_ADDRESSES permission.
 */
const createAddressController = wrapAsyncHandler(async (req, res) => {
  const addresses = req.body;
  const user      = req.auth.user;
  const isBulk    = addresses.length > 1;
  
  const result = await createAddressService(addresses, user);
  
  res.status(201).json({
    success: true,
    message: isBulk
      ? 'Bulk addresses created successfully.'
      : 'Address created successfully.',
    data:    isBulk ? result : result[0],
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/addresses
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated address records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_ADDRESS permission.
 */
const getPaginatedAddressesController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  const { data, pagination } = await fetchPaginatedAddressesService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Addresses retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  createAddressController,
  getPaginatedAddressesController,
};
