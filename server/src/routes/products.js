/**
 * @file products.js
 * @description Product query, creation, and management routes.
 * Covers paginated listing, detail view, bulk creation, info updates,
 * and status transitions.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const {
  productQuerySchema,
  productIdParamSchema,
  productUpdateSchema,
  createProductBulkSchema,
  updateProductStatusSchema,
} = require('../validators/product-validators');
const {
  getPaginatedProductsController,
  getProductDetailsController,
  updateProductStatusController,
  updateProductInfoController,
  createProductsController,
} = require('../controllers/product-controller');

const router = express.Router();

/**
 * @route GET /products
 * @description Paginated product records with optional filters and sorting.
 * Filters: statusIds.
 * Sorting: sortBy, sortOrder (uses productSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.PRODUCTS.VIEW
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.PRODUCTS.VIEW]),
  validate(productQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'productSortMap', // moduleKey — drives allowed sortBy fields
    ['statusIds'], // arrayKeys — normalized as UUID arrays
    [], // booleanKeys — none client-controlled
    productQuerySchema // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedProductsController
);

/**
 * @route GET /products/:productId/details
 * @description Full detail record for a single product by ID.
 * @access protected
 * @permission PERMISSION_KEYS.PRODUCTS.VIEW_DETAILS
 */
router.get(
  '/:productId/details',
  authorize([PERMISSION_KEYS.PRODUCTS.VIEW_DETAILS]),
  validate(productIdParamSchema, 'params'),
  getProductDetailsController
);

/**
 * @route PATCH /products/:productId/status
 * @description Transition a product to a new status.
 * @access protected
 * @permission PERMISSION_KEYS.PRODUCTS.UPDATE_STATUS
 */
router.patch(
  '/:productId/status',
  authorize([PERMISSION_KEYS.PRODUCTS.UPDATE_STATUS]),
  validate(productIdParamSchema, 'params'),
  validate(updateProductStatusSchema, 'body'),
  updateProductStatusController
);

/**
 * @route PUT /products/:productId/info
 * @description Replace editable product info fields (full update).
 * @access protected
 * @permission PERMISSION_KEYS.PRODUCTS.UPDATE_INFO
 */
router.put(
  '/:productId/info',
  authorize([PERMISSION_KEYS.PRODUCTS.UPDATE_INFO]),
  validate(productIdParamSchema, 'params'),
  validate(productUpdateSchema, 'body'),
  updateProductInfoController
);

/**
 * @route POST /products/create
 * @description Bulk create one or more product records.
 * @access protected
 * @permission PERMISSION_KEYS.PRODUCTS.CREATE
 */
router.post(
  '/create',
  authorize([PERMISSION_KEYS.PRODUCTS.CREATE]),
  validate(createProductBulkSchema, 'body'),
  createProductsController
);

module.exports = router;
