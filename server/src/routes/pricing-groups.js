/**
 * @file pricing-group-routes.js
 * @description Routes for pricing group records.
 *
 * Endpoints:
 *  GET /pricing-groups                          — paginated list with filters and sorting
 *  GET /pricing-groups/:pricingGroupId          — single pricing group detail by ID
 *  GET /pricing-groups/:pricingGroupId/skus     — paginated SKU list for a pricing group
 *
 * Note: the /:pricingGroupId/skus endpoint controller and service chain belong
 * to the pricing module — the URL is nested here by REST convention since SKUs
 * are a sub-resource of a group, but data comes from the pricing join table.
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const {
  getPaginatedPricingGroupsController,
  getPricingGroupByIdController,
} = require('../controllers/pricing-group-controller');
const { getPaginatedPricingSkusController } = require('../controllers/pricing-controller');
const {
  pricingGroupQuerySchema,
  pricingGroupParamsSchema,
  pricingSkuQuerySchema,
} = require('../validators/pricing-group-validators');

const router = express.Router();

/**
 * @route GET /pricing-groups
 * @description Paginated pricing group records with optional filters and sorting.
 * Filters: pricingTypeId, countryCode, statusId, validFrom, validTo, skuId, productId.
 * Sorting: sortBy, sortOrder (uses pricingGroupListSortMap).
 * @access protected
 * @permission view_pricing
 */
router.get(
  '/',
  authorize([PERMISSIONS.PRICING_GROUPS.VIEW]),
  validate(pricingGroupQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'pricingGroupListSortMap',
    [],
    [],
    pricingGroupQuerySchema
  ),
  getPaginatedPricingGroupsController
);

/**
 * @route GET /pricing-groups/:pricingGroupId
 * @description Single pricing group detail by ID.
 * @access protected
 * @permission view_pricing
 */
router.get(
  '/:pricingGroupId',
  authorize([PERMISSIONS.PRICING_GROUPS.VIEW_DETAILS]),
  validate(pricingGroupParamsSchema, 'params'),
  getPricingGroupByIdController
);

/**
 * @route GET /pricing-groups/:pricingGroupId/skus
 * @description Paginated SKU list assigned to a pricing group.
 * Filters: search, brand, category, productId, skuId, countryCode.
 * Sorting: sortBy, sortOrder (uses pricingSkuListSortMap).
 * @access protected
 * @permission view_pricing
 */
router.get(
  '/:pricingGroupId/skus',
  authorize([PERMISSIONS.PRICING_GROUPS.VIEW_SKUS]),
  validate(pricingGroupParamsSchema, 'params'),
  validate(pricingSkuQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'pricingSkuListSortMap',
    [],
    [],
    pricingSkuQuerySchema
  ),
  getPaginatedPricingSkusController
);

module.exports = router;
