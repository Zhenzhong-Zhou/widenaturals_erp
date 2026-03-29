/**
 * @file inventory-allocation-controller.js
 * @module controllers/inventory-allocation-controller
 *
 * @description
 * Controllers for the Inventory Allocation resource.
 *
 * Routes:
 *   POST   /api/v1/orders/:orderId/inventory-allocations          → allocateInventoryForOrderController
 *   GET    /api/v1/orders/:orderId/inventory-allocations/review   → reviewInventoryAllocationController
 *   GET    /api/v1/inventory-allocations                          → getPaginatedInventoryAllocationsController
 *   PATCH  /api/v1/orders/:orderId/inventory-allocations/confirm  → confirmInventoryAllocationController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId) are emitted
 *   automatically by the global request-logger middleware via res.on('finish').
 *
 *   Write controllers (allocate, confirm) log at controller level because
 *   orderId and operation intent are context the global middleware cannot infer.
 *   Read controllers (review, paginated) rely solely on the global finish log.
 *
 * Not-found handling:
 *   The service layer throws AppError.notFound() when no records exist.
 *   Controllers never check result shape or manually return 404.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  allocateInventoryForOrderService,
  reviewInventoryAllocationService,
  confirmInventoryAllocationService,
  fetchPaginatedInventoryAllocationsService,
} = require('../services/inventory-allocation-service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/orders/:orderId/inventory-allocations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Allocates inventory for a specific order.
 *
 * Supports strategy, warehouse targeting, and partial allocation options.
 * Requires: auth middleware, Joi body validation, ALLOCATE_INVENTORY permission.
 */
const allocateInventoryForOrderController = wrapAsyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { strategy, warehouseId, allowPartial } = req.body;
  const user = req.auth.user;
  
  const result = await allocateInventoryForOrderService(user, orderId, {
    strategy,
    warehouseId,
    allowPartial,
  });
  
  res.status(200).json({
    success: true,
    message: 'Inventory allocation complete.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/orders/:orderId/inventory-allocations/review
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves inventory allocation review data for a specific order.
 *
 * Not-found case is handled by the service layer via AppError.notFound().
 * Requires: auth middleware, Joi body validation, VIEW_INVENTORY_ALLOCATIONS permission.
 */
const reviewInventoryAllocationController = wrapAsyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const { warehouseIds = [], allocationIds = [] } = req.body;
  
  const result = await reviewInventoryAllocationService(
    orderId,
    warehouseIds,
    allocationIds,
  );
  
  res.status(200).json({
    success: true,
    message: 'Inventory allocation review retrieved successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/inventory-allocations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated inventory allocation records with optional filters and sorting.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_INVENTORY_ALLOCATIONS permission.
 */
const getPaginatedInventoryAllocationsController = wrapAsyncHandler(async (req, res) => {
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  
  const { data, pagination } = await fetchPaginatedInventoryAllocationsService({
    filters,
    page,
    limit,
    sortBy,
    sortOrder,
  });
  
  res.status(200).json({
    success: true,
    message: 'Inventory allocations retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/orders/:orderId/inventory-allocations/confirm
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Confirms a pending inventory allocation for a specific order.
 *
 * Requires: auth middleware, CONFIRM_INVENTORY_ALLOCATION permission.
 */
const confirmInventoryAllocationController = wrapAsyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const user = req.auth.user;
  
  const result = await confirmInventoryAllocationService(user, orderId);
  
  res.status(200).json({
    success: true,
    message: 'Inventory allocation confirmed successfully.',
    data:    result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  allocateInventoryForOrderController,
  reviewInventoryAllocationController,
  getPaginatedInventoryAllocationsController,
  confirmInventoryAllocationController,
};
