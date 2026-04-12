/**
 * @file pricing-type-routes.js
 * @description Routes for pricing type records.
 *
 * Endpoints:
 *  GET /pricing-types              — paginated list with filters and sorting
 *  GET /pricing-types/:pricingTypeId — single pricing type detail by ID
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const {
  getPaginatedPricingTypesController,
  getPricingTypeByIdController,
} = require('../controllers/pricing-type-controller');
const {
  pricingTypeQuerySchema,
  pricingTypeParamsSchema,
} = require('../validators/pricing-type-validators');

const router = express.Router();

/**
 * @route GET /pricing-types
 * @description Paginated pricing type records with optional filters and sorting.
 * Filters: statusId, search, createdAfter, createdBefore, createdBy, updatedBy.
 * Sorting: sortBy, sortOrder (uses pricingTypeSortMap).
 * @access protected
 * @permission view_pricing
 */
router.get(
  '/',
  authorize([PERMISSIONS.PRICING_TYPES.VIEW]),
  validate(pricingTypeQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'pricingTypeSortMap',
    [],
    [],
    pricingTypeQuerySchema
  ),
  getPaginatedPricingTypesController
);

/**
 * @route GET /pricing-types/:pricingTypeId/details
 * @description Single pricing type detail by ID.
 * @access protected
 * @permission view_pricing
 */
router.get(
  '/:pricingTypeId/details',
  authorize([PERMISSIONS.PRICING_TYPES.VIEW_PRICING_TYPES_DETAILS]),
  validate(pricingTypeParamsSchema, 'params'),
  getPricingTypeByIdController
);

module.exports = router;
