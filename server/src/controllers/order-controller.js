/**
 * @file order-controller.js
 * @module controllers/order-controller
 *
 * @description
 * Controllers for the Order resource.
 *
 * Routes:
 *   POST  /api/v1/orders/:category              → createOrderController
 *   GET   /api/v1/orders/:category              → fetchPaginatedOrdersController
 *   GET   /api/v1/orders/:category/:orderId     → getOrderDetailsByIdController
 *   PATCH /api/v1/orders/:category/:orderId/status → updateOrderStatusController
 *
 * All handlers are wrapped with `wrapAsyncHandler` — errors propagate
 * automatically to the global error handler without try/catch boilerplate.
 *
 * Logging:
 *   Transport-level logs (statusCode, durationMs, userId, traceId) are emitted
 *   automatically by the global request-logger middleware via res.on('finish').
 *
 *   Write controllers (create, updateStatus) log at controller level because
 *   orderId, category, and operation context are not inferable by the middleware.
 *   Read controllers (paginated, details) rely solely on the global finish log.
 *
 * Validation:
 *   category, orderId, statusCode, and body shape are validated upstream
 *   by Joi middleware. Controllers never validate, coerce, or sanitize input.
 *
 * Audit fields (created_by):
 *   Injected in the service layer where the transaction lives — not here.
 */

'use strict';

const { wrapAsyncHandler } = require('../middlewares/async-handler');
const {
  createOrderService,
  fetchOrderDetailsByIdService,
  updateOrderStatusService,
  fetchPaginatedOrdersService,
} = require('../services/order-service');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/v1/orders/:category
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a new order under the specified category.
 *
 * category and body shape are validated upstream by Joi.
 * Audit field (created_by) is injected in the service layer.
 * Requires: auth middleware, Joi validation, CREATE_ORDER permission.
 */
const createOrderController = wrapAsyncHandler(async (req, res) => {
  const { category } = req.params;
  const user = req.auth.user;

  const result = await createOrderService(req.body, category, user);

  res.status(201).json({
    success: true,
    message: 'Order created successfully.',
    data: result,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/orders/:category
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves paginated orders for the specified category.
 *
 * Reads from req.normalizedQuery — populated by createQueryNormalizationMiddleware.
 * Requires: auth middleware, query normalizer, VIEW_ORDERS permission.
 */
const fetchPaginatedOrdersController = wrapAsyncHandler(async (req, res) => {
  const { category } = req.params;
  const { page, limit, sortBy, sortOrder, filters } = req.normalizedQuery;
  const user = req.auth.user;

  const { data, pagination } = await fetchPaginatedOrdersService({
    filters,
    category,
    user,
    page,
    limit,
    sortBy,
    sortOrder,
  });

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully.',
    data,
    pagination,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/v1/orders/:category/:orderId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieves full details for a specific order.
 *
 * Not-found case is handled by the service layer via AppError.notFound().
 * Requires: auth middleware, VIEW_ORDERS permission.
 */
const getOrderDetailsByIdController = wrapAsyncHandler(async (req, res) => {
  const { category, orderId } = req.params;
  const user = req.auth.user;

  const data = await fetchOrderDetailsByIdService(category, orderId, user);

  res.status(200).json({
    success: true,
    message: 'Order details retrieved successfully.',
    data,
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/orders/:category/:orderId/status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the status of a specific order.
 *
 * statusCode is validated upstream by Joi.
 * Requires: auth middleware, Joi body validation, UPDATE_ORDER_STATUS permission.
 */
const updateOrderStatusController = wrapAsyncHandler(async (req, res) => {
  const { category, orderId } = req.params;
  const { statusCode } = req.body;
  const user = req.auth.user;

  const { enrichedOrder, enrichedItems } = await updateOrderStatusService(
    user,
    category,
    orderId,
    statusCode
  );

  res.status(200).json({
    success: true,
    message: 'Order status updated successfully.',
    data: {
      order: enrichedOrder,
      items: enrichedItems,
    },
    meta: {
      itemsUpdated: enrichedItems.length,
      recordsUpdated: 1 + enrichedItems.length,
    },
    traceId: req.traceId,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  createOrderController,
  fetchPaginatedOrdersController,
  getOrderDetailsByIdController,
  updateOrderStatusController,
};
