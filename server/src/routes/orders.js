/**
 * @file orders.js
 * @description Order creation, detail, status update, and paginated query routes.
 * Supports multiple order categories (e.g. sales) via a dynamic schema map.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS                        = require('../utils/constants/domain/permission-keys');
const AppError                           = require('../utils/AppError');
const salesOrderSchema                   = require('../validators/sales-order-validators');
const {
  orderCategorySchema,
  orderIdentifierSchema,
  orderQuerySchema,
  updateOrderStatusSchema,
} = require('../validators/order-validators');
const {
  createOrderController,
  getOrderDetailsByIdController,
  updateOrderStatusController,
  fetchPaginatedOrdersController,
} = require('../controllers/order-controller');

const router = express.Router();

/**
 * Category-to-schema map for dynamic order creation validation.
 * Add new order categories here as they are introduced.
 */
const schemaMap = {
  sales: salesOrderSchema,
  // purchase: purchaseOrderSchema,
  // transfer: transferOrderSchema,
};

/**
 * @route POST /orders/create/:category
 * @description Create a new order for the given category. The request body schema
 * is resolved dynamically from `schemaMap` based on the category param.
 * Unsupported categories are rejected with a validation error before reaching
 * the controller.
 * @access protected
 * @permission PERMISSION_KEYS.ORDERS.CREATE
 */
router.post(
  '/create/:category',
  authorize([PERMISSION_KEYS.ORDERS.CREATE]),
  (req, res, next) => {
    const category = req.params.category.toLowerCase();
    const schema   = schemaMap[category];
    
    if (!schema) {
      return next(
        AppError.validationError(`Unsupported order category: ${category}`)
      );
    }
    
    return validate(schema, 'body')(req, res, next);
  },
  createOrderController
);

/**
 * @route GET /orders/:category
 * @description Paginated order records for a given category with optional filters
 * and sorting.
 * Sorting: sortBy, sortOrder (uses orderSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.ORDERS.VIEW
 */
router.get(
  '/:category',
  authorize([PERMISSION_KEYS.ORDERS.VIEW]),
  validate(orderCategorySchema, 'params'),
  validate(orderQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'orderSortMap',    // moduleKey — drives allowed sortBy fields
    [],                // arrayKeys — none for orders
    [],                // booleanKeys — none client-controlled
    orderQuerySchema   // filterKeysOrSchema — extracts filter keys from schema
  ),
  fetchPaginatedOrdersController
);

/**
 * @route GET /orders/:category/:orderId
 * @description Full detail record for a single order by category and order ID.
 * @access protected
 * @permission PERMISSION_KEYS.ORDERS.VIEW
 */
router.get(
  '/:category/:orderId',
  authorize([PERMISSION_KEYS.ORDERS.VIEW]),
  validate(orderIdentifierSchema, 'params'),
  getOrderDetailsByIdController
);

/**
 * @route PATCH /orders/:category/:orderId/status
 * @description Update the status of a specific order. Validates both the order
 * identifier and the status transition payload before delegating to the controller.
 * @access protected
 * @permission PERMISSION_KEYS.ORDERS.UPDATE_STATUS
 */
router.patch(
  '/:category/:orderId/status',
  authorize([PERMISSION_KEYS.ORDERS.UPDATE_STATUS]),
  validate(orderIdentifierSchema, 'params'),
  validate(updateOrderStatusSchema, 'body'),
  updateOrderStatusController
);

module.exports = router;
