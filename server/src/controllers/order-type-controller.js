/**
 * @file order-type-controller.js
 * @module controllers/order-type-controller
 *
 * @description
 * Controllers for the Order Type resource.
 *
 * Routes:
 *   GET /api/v1/order-types  → getPaginatedOrderTypesController
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
  fetchPaginatedOrderTypesService,
} = require('../services/order-type-service');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/order-types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated order type records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_ORDER_TYPES permission.
 */
const getPaginatedOrderTypesController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  const { data, pagination } = await fetchPaginatedOrderTypesService({
    user: req.auth.user,
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success:   true,
    message:   'Order types retrieved successfully.',
    data,
    pagination,
    traceId:   req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getPaginatedOrderTypesController,
};
