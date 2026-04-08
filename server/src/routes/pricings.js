/**
 * @file pricing-routes.js
 * @description Routes for pricing records.
 *
 * Endpoints:
 *  GET /pricing/export      — full dataset export as CSV or XLSX
 *  GET /skus/:skuId/pricing — all pricing groups a SKU belongs to
 */

'use strict';

const express                            = require('express');
const { authorize }                      = require('../middlewares/authorize');
const validate                           = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const {
  exportPricingRecordsController,
  getPricingBySkuIdController,
} = require('../controllers/pricing-controller');
const { pricingExportQuerySchema } = require('../validators/pricing-validators');
const { skuIdParamSchema }         = require('../validators/sku-validators');

const router = express.Router();

/**
 * @route GET /pricing/export
 * @description Exports all pricing records matching filters as CSV or XLSX.
 * Filters: pricingTypeId, countryCode, statusId, brand, productId.
 * Query: exportFormat ('csv' | 'xlsx').
 * @access protected
 * @permission export_pricing
 */
router.get(
  '/export',
  authorize([PERMISSIONS.PRICING.EXPORT_DATA]),
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
 * @permission view_pricing
 */
router.get(
  '/skus/:skuId/pricing',
  authorize([PERMISSIONS.PRICING.VIEW]),
  validate(skuIdParamSchema, 'params'),
  getPricingBySkuIdController
);

module.exports = router;
