/**
 * @file customer-controller.js
 * @module controllers/customer-controller
 *
 * @description
 * Controllers for the Customer resource.
 *
 * Routes:
 *   POST /api/v1/customers  → createCustomerController
 *   GET  /api/v1/customers  → getPaginatedCustomersController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId, pagination,
 *   sorting, filters) are emitted automatically by the global request-logger
 *   middleware via res.on('finish').
 *
 *   createCustomerController logs at controller level because recordCount
 *   is write-specific context the global middleware cannot infer.
 *   getPaginatedCustomersController relies solely on the global finish log.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  createCustomersService,
  fetchPaginatedCustomersService,
} = require('../services/customer-service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/customers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates one or more customer records.
 *
 * Accepts a JSON array in req.body for single or bulk insertion.
 * Returns a single object for one customer, or an array for bulk.
 *
 * Requires: auth middleware, Joi body validation, CREATE_CUSTOMERS permission.
 */
const createCustomerController = wrapAsyncHandler(async (req, res) => {
  const customers = req.body;
  const user      = req.auth.user;
  const isBulk    = customers.length > 1;

  const result = await createCustomersService(customers, user);
  
  res.status(201).json({
    success: true,
    message: isBulk
      ? 'Bulk customers created successfully.'
      : 'Customer created successfully.',
    data:    isBulk ? result : result[0],
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/customers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated customer records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_CUSTOMERS permission.
 */
const getPaginatedCustomersController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  const { data, pagination } = await fetchPaginatedCustomersService({
    user: req.auth.user,
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Customers retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  createCustomerController,
  getPaginatedCustomersController,
};
