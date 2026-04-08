/**
 * @file skus.js
 * @description SKU query, creation, and management routes.
 * Covers paginated listing, product card view, detail view, bulk creation,
 * and targeted field updates (metadata, status, dimensions, identity).
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization is handled by `createQueryNormalizationMiddleware`.
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSIONS                        = require('../utils/constants/domain/permissions');
const {
  getPaginatedSkuProductCardsSchema,
  skuQuerySchema,
  skuIdParamSchema,
  createSkuBulkSchema,
  updateSkuStatusSchema,
  updateSkuMetadataSchema,
  updateSkuDimensionsSchema,
  updateSkuIdentitySchema,
} = require('../validators/sku-validators');
const {
  getPaginatedSkuProductCardsController,
  getPaginatedSkusController,
  getSkuDetailsController,
  createSkusController,
  updateSkuStatusController,
  updateSkuMetadataController,
  updateSkuDimensionsController,
  updateSkuIdentityController,
} = require('../controllers/sku-controller');

const router = express.Router();

/**
 * @route GET /skus/cards
 * @description Paginated SKU product cards with optional filters and sorting.
 * Filters: skuIds.
 * Sorting: sortBy, sortOrder (uses skuProductCards sort map).
 * @access protected
 * @permission SKUS.VIEW_CARDS
 */
router.get(
  '/cards',
  authorize([PERMISSIONS.SKUS.VIEW_CARDS]),
  validate(getPaginatedSkuProductCardsSchema, 'query'),
  createQueryNormalizationMiddleware(
    'skuProductCards',                  // moduleKey — drives allowed sortBy fields
    ['skuIds'],                         // arrayKeys — normalized as UUID arrays
    [],                                 // booleanKeys — none client-controlled
    getPaginatedSkuProductCardsSchema   // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedSkuProductCardsController
);

/**
 * @route GET /skus
 * @description Paginated SKU records with optional filters and sorting.
 * Filters: statusIds, productIds.
 * Sorting: sortBy, sortOrder (uses skuSortMap).
 * @access protected
 * @permission SKUS.VIEW_LIST
 */
router.get(
  '/',
  authorize([PERMISSIONS.SKUS.VIEW_LIST]),
  validate(skuQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'skuSortMap',                  // moduleKey — drives allowed sortBy fields
    ['statusIds', 'productIds'],   // arrayKeys — normalized as UUID arrays
    [],                            // booleanKeys — none client-controlled
    skuQuerySchema                 // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedSkusController
);

/**
 * @route GET /skus/:skuId/details
 * @description Full detail record for a single SKU by ID.
 * @access protected
 * @permission SKUS.VIEW_DETAILS
 */
router.get(
  '/:skuId/details',
  authorize([PERMISSIONS.SKUS.VIEW_DETAILS]),
  validate(skuIdParamSchema, 'params'),
  getSkuDetailsController
);

/**
 * @route POST /skus/create
 * @description Bulk create one or more SKU records.
 * @access protected
 * @permission SKUS.CREATE
 */
router.post(
  '/create',
  authorize([PERMISSIONS.SKUS.CREATE]),
  validate(createSkuBulkSchema, 'body'),
  createSkusController
);

/**
 * @route PATCH /skus/:skuId/metadata
 * @description Update editable metadata fields on a SKU.
 * @access protected
 * @permission SKUS.UPDATE_METADATA
 */
router.patch(
  '/:skuId/metadata',
  authorize([PERMISSIONS.SKUS.UPDATE_METADATA]),
  validate(skuIdParamSchema, 'params'),
  validate(updateSkuMetadataSchema, 'body'),
  updateSkuMetadataController
);

/**
 * @route PATCH /skus/:skuId/status
 * @description Transition a SKU to a new status.
 * @access protected
 * @permission SKUS.UPDATE_STATUS
 */
router.patch(
  '/:skuId/status',
  authorize([PERMISSIONS.SKUS.UPDATE_STATUS]),
  validate(skuIdParamSchema, 'params'),
  validate(updateSkuStatusSchema, 'body'),
  updateSkuStatusController
);

/**
 * @route PATCH /skus/:skuId/dimensions
 * @description Update physical dimension fields on a SKU.
 * @access protected
 * @permission SKUS.UPDATE_DIMENSIONS
 */
router.patch(
  '/:skuId/dimensions',
  authorize([PERMISSIONS.SKUS.UPDATE_DIMENSIONS]),
  validate(skuIdParamSchema, 'params'),
  validate(updateSkuDimensionsSchema, 'body'),
  updateSkuDimensionsController
);

/**
 * @route PATCH /skus/:skuId/identity
 * @description Update identity fields on a SKU (e.g. codes, identifiers).
 * @access protected
 * @permission SKUS.UPDATE_IDENTITY
 */
router.patch(
  '/:skuId/identity',
  authorize([PERMISSIONS.SKUS.UPDATE_IDENTITY]),
  validate(skuIdParamSchema, 'params'),
  validate(updateSkuIdentitySchema, 'body'),
  updateSkuIdentityController
);

module.exports = router;
