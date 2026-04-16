/**
 * @file pricing-routes.js
 * @description Routes for pricing records.
 *
 * Endpoints:
 *  GET /pricing         — paginated pricing join list (scoped by group, type, SKU, or cross-group)
 *  GET /pricing/export  — full dataset export as CSV or XLSX
 *  GET /skus/:skuId/pricing — all pricing groups a SKU belongs to
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const {
  exportPricingRecordsController,
  getPricingBySkuIdController, getPaginatedPricingJoinController,
} = require('../controllers/pricing-controller');
const { pricingExportQuerySchema, pricingJoinQuerySchema } = require('../validators/pricing-validators');
const { skuIdParamSchema }         = require('../validators/sku-validators');

const router = express.Router();

/**
 * @route GET /pricing
 * @description Paginated pricing join list. Scope is determined by filters —
 * pass pricingGroupId, pricingTypeId, or skuId to narrow results, or omit
 * for a cross-group price book view.
 * Filters: pricingGroupId, pricingTypeId, skuId, productId, search, brand,
 *          category, countryCode, statusId, currentlyValid, validFrom, validTo, validOn.
 * Sorting: sortBy, sortOrder (uses pricingJoinSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.PRICING.VIEW
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.PRICING.VIEW]),
  validate(pricingJoinQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'pricingJoinSortMap',
    [],
    [],
    pricingJoinQuerySchema
  ),
  getPaginatedPricingJoinController
);

/**
 * @route GET /pricing/export
 * @description Exports all pricing records matching filters as CSV or XLSX.
 * Filters: pricingTypeId, countryCode, statusId, brand, productId.
 * Query: exportFormat ('csv' | 'xlsx').
 * @access protected
 * @permission PERMISSION_KEYS.PRICING.EXPORT_DATA
 */
router.get(
  '/export',
  authorize([PERMISSION_KEYS.PRICING.EXPORT_DATA]),
  validate(pricingExportQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    null,
    [],
    [],
    pricingExportQuerySchema
  ),
  exportPricingRecordsController
);

/**
 * @route GET /skus/:skuId/pricing
 * @description All pricing groups a SKU belongs to.
 * @access protected
 * @permission PERMISSION_KEYS.PRICING.VIEW
 */
router.get(
  '/skus/:skuId/pricing',
  authorize([PERMISSION_KEYS.PRICING.VIEW]),
  validate(skuIdParamSchema, 'params'),
  getPricingBySkuIdController
);

module.exports = router;
