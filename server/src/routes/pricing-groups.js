/**
 * @file pricing-group-routes.js
 * @description Routes for pricing group records.
 *
 * Endpoints:
 *  GET /pricing-groups                 — paginated list with filters and sorting
 *  GET /pricing-groups/:pricingGroupId — single pricing group detail by ID
 */

'use strict';

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const validate = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const {
  getPaginatedPricingGroupsController,
  getPricingGroupByIdController,
} = require('../controllers/pricing-group-controller');
const {
  pricingGroupQuerySchema,
  pricingGroupParamsSchema,
} = require('../validators/pricing-group-validators');

const router = express.Router();

/**
 * @route GET /pricing-groups
 * @description Paginated pricing group records with optional filters and sorting.
 * Filters: pricingTypeId, countryCode, statusId, validFrom, validTo, skuId, productId.
 * Sorting: sortBy, sortOrder (uses pricingGroupSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.PRICING_GROUPS.VIEW
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.PRICING_GROUPS.VIEW]),
  validate(pricingGroupQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'pricingGroupSortMap',
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
 * @permission PERMISSION_KEYS.PRICING_GROUPS.VIEW_DETAILS
 */
router.get(
  '/:pricingGroupId',
  authorize([PERMISSION_KEYS.PRICING_GROUPS.VIEW_DETAILS]),
  validate(pricingGroupParamsSchema, 'params'),
  getPricingGroupByIdController
);

module.exports = router;
