/**
 * @file boms.js
 * @description Bill of Materials (BOM) list, detail, and production summary routes.
 *
 * All routes are protected and require explicit permission checks via `authorize`.
 * Query normalization for the paginated list is handled by
 * `createQueryNormalizationMiddleware`.
 */

'use strict';

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const PERMISSION_KEYS = require('../utils/constants/domain/permission-keys');
const validate = require('../middlewares/validate');
const createQueryNormalizationMiddleware = require('../middlewares/normalize-query');
const {
  bomQuerySchema,
  bomIdParamSchema,
} = require('../validators/bom-validators');
const {
  getPaginatedBomsController,
  getBomDetailsController,
  getBomProductionSummaryController,
} = require('../controllers/bom-controller');

const router = express.Router();

/**
 * @route GET /boms
 * @description Paginated BOM records with optional filters, sorting, and keyword search.
 * Filters: productId, skuId, productName, skuCode, statusId, isActive, isDefault,
 *          onlyActiveCompliance, revisionMin, revisionMax, createdAfter,
 *          createdBefore, keyword.
 * Sorting: sortBy, sortOrder (uses bomSortMap).
 * @access protected
 * @permission PERMISSION_KEYS.BOMS.VIEW_LIST
 */
router.get(
  '/',
  authorize([PERMISSION_KEYS.BOMS.VIEW_LIST]),
  validate(bomQuerySchema, 'query'),
  createQueryNormalizationMiddleware(
    'bomSortMap', // moduleKey — drives allowed sortBy fields
    ['productId'], // arrayKeys — normalized as UUID arrays
    [
      // booleanKeys — normalized to true/false
      'onlyActiveCompliance',
      'isActive',
      'isDefault',
    ],
    bomQuerySchema // filterKeysOrSchema — extracts filter keys from schema
  ),
  getPaginatedBomsController
);

/**
 * @route GET /boms/:bomId/details
 * @description Full BOM detail including product metadata, compliance info, BOM header,
 * line items with quantities and estimated unit costs, and an aggregated cost summary.
 * Estimated costs are static (estimated_unit_cost) — not real-time procurement costs.
 * @access protected
 * @permission PERMISSION_KEYS.BOMS.VIEW_BOM_DETAILS
 */
router.get(
  '/:bomId/details',
  authorize([PERMISSION_KEYS.BOMS.VIEW_BOM_DETAILS]),
  validate(bomIdParamSchema, 'params'),
  getBomDetailsController
);

/**
 * @route GET /boms/:bomId/production-summary
 * @description Production readiness summary for a BOM. Includes required quantities
 * per part, available material stock across warehouses, maximum manufacturable units
 * (bottleneck-based), shortages, and stock health indicators.
 * @access protected
 * @permission PERMISSION_KEYS.BOMS.VIEW_BOM_PRODUCTION_SUMMARY
 */
router.get(
  '/:bomId/production-summary',
  authorize([PERMISSION_KEYS.BOMS.VIEW_BOM_PRODUCTION_SUMMARY]),
  validate(bomIdParamSchema, 'params'),
  getBomProductionSummaryController
);

module.exports = router;
