/**
 * @file product-batches.js
 * @description Product batch query, creation, and lifecycle management routes.
 * Covers paginated listing, detail view, bulk creation, metadata edits, and
 * status transitions (update, receive, release).
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const { PRODUCT_BATCHES }                = require('../utils/constants/domain/permissions');
const {
  productBatchQuerySchema,
  productBatchIdParamSchema,
  createProductBatchBulkSchema,
  editProductBatchMetadataSchema,
  updateProductBatchStatusSchema,
  receiveProductBatchSchema,
  releaseProductBatchSchema,
} = require('../validators/product-batch-validators');
const {
  getPaginatedProductBatchesController,
  createProductBatchesController,
  editProductBatchMetadataController,
  updateProductBatchStatusController,
  receiveProductBatchController,
  releaseProductBatchController,
  getProductBatchDetailsController,
} = require('../controllers/product-batch-controller');

const router = express.Router();

/**
 * @route GET /product-batches
 * @description Paginated product batch records with optional filters and sorting.
 * Filters: statusIds, skuIds, productIds, manufacturerIds.
 * Sorting: sortBy, sortOrder (uses productBatchSortMap).
 * @access protected
 * @permission PRODUCT_BATCHES.VIEW_LIST
 */
router.get(
  '/',
  authorize([PRODUCT_BATCHES.VIEW_LIST]),
  validate(productBatchQuerySchema, 'query', {
    allowUnknown: true, // downstream middleware normalizes unknown keys before business layer
  }),
  createQueryNormalizationMiddleware(
    'productBatchSortMap',      // moduleKey — drives allowed sortBy fields
    [                           // arrayKeys — normalized as UUID arrays
      'statusIds',
      'skuIds',
      'productIds',
      'manufacturerIds',
    ],
    [],                         // booleanKeys — none client-controlled
    productBatchQuerySchema,    // filterKeysOrSchema — extracts filter keys from schema
    {},                         // options overrides — none
    [],                         // option-level booleans — none
    []                          // option-level strings — none
  ),
  getPaginatedProductBatchesController
);

/**
 * @route POST /product-batches/create
 * @description Bulk create one or more product batch records.
 * @access protected
 * @permission PRODUCT_BATCHES.CREATE
 */
router.post(
  '/create',
  authorize([PRODUCT_BATCHES.CREATE]),
  validate(createProductBatchBulkSchema, 'body'),
  createProductBatchesController
);

/**
 * @route PATCH /product-batches/:batchId/metadata
 * @description Update editable metadata fields on a product batch.
 * @access protected
 * @permission PRODUCT_BATCHES.EDIT
 */
router.patch(
  '/:batchId/metadata',
  authorize([PRODUCT_BATCHES.EDIT]),
  validate(productBatchIdParamSchema, 'params'),
  validate(editProductBatchMetadataSchema, 'body'),
  editProductBatchMetadataController
);

/**
 * @route PATCH /product-batches/:batchId/status
 * @description Transition a product batch to a new status.
 * @access protected
 * @permission PRODUCT_BATCHES.UPDATE_STATUS
 */
router.patch(
  '/:batchId/status',
  authorize([PRODUCT_BATCHES.UPDATE_STATUS]),
  validate(productBatchIdParamSchema, 'params'),
  validate(updateProductBatchStatusSchema, 'body'),
  updateProductBatchStatusController
);

/**
 * @route PATCH /product-batches/:batchId/receive
 * @description Record physical receipt of a product batch into the warehouse.
 * @access protected
 * @permission PRODUCT_BATCHES.RECEIVE
 */
router.patch(
  '/:batchId/receive',
  authorize([PRODUCT_BATCHES.RECEIVE]),
  validate(productBatchIdParamSchema, 'params'),
  validate(receiveProductBatchSchema, 'body'),
  receiveProductBatchController
);

/**
 * @route PATCH /product-batches/:batchId/release
 * @description Release a product batch for operational use.
 * @access protected
 * @permission PRODUCT_BATCHES.RELEASE
 */
router.patch(
  '/:batchId/release',
  authorize([PRODUCT_BATCHES.RELEASE]),
  validate(productBatchIdParamSchema, 'params'),
  validate(releaseProductBatchSchema, 'body'),
  releaseProductBatchController
);

/**
 * @route GET /product-batches/:batchId/details
 * @description Full detail record for a single product batch by ID.
 * @access protected
 * @permission PRODUCT_BATCHES.VIEW_DETAILS
 */
router.get(
  '/:batchId/details',
  authorize([PRODUCT_BATCHES.VIEW_DETAILS]),
  validate(productBatchIdParamSchema, 'params'),
  getProductBatchDetailsController
);

module.exports = router;
