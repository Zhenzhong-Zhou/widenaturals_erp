/**
 * @file reports.js
 * @description Report query routes.
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
  inventoryActivityLogQuerySchema,
} = require('../validators/report-validators');
const {
  getInventoryActivityLogsController,
} = require('../controllers/report-controller');

const router = express.Router();

/**
 * @route GET /reports/inventory-activity-logs
 * @description Paginated inventory activity log records with optional filters and sorting.
 * Filters: warehouseIds, locationIds, productIds, skuIds, batchIds,
 *          packagingMaterialIds, actionTypeIds, orderId, statusId,
 *          adjustmentTypeIds, performedBy.
 * Sorting: sortBy, sortOrder (uses inventoryActivityLogSortMap).
 * @access protected
 * @permission REPORTS.VIEW_INVENTORY_LOGS
 */
router.get(
  '/inventory-activity-logs',
  authorize([PERMISSIONS.REPORTS.VIEW_INVENTORY_LOGS]),
  validate(
    inventoryActivityLogQuerySchema,
    'query',
    { convert: true },
    'Invalid inventory activity log query parameters.'
  ),
  createQueryNormalizationMiddleware(
    'inventoryActivityLogSortMap', // moduleKey — drives allowed sortBy fields
    [                              // arrayKeys — normalized as UUID arrays
      'warehouseIds',
      'locationIds',
      'productIds',
      'skuIds',
      'batchIds',
      'packagingMaterialIds',
      'actionTypeIds',
      'orderId',
      'statusId',
      'adjustmentTypeIds',
      'performedBy',
    ],
    [],                   // booleanKeys — none client-controlled
    inventoryActivityLogQuerySchema  // filterKeysOrSchema — extracts filter keys from schema
  ),
  getInventoryActivityLogsController
);

module.exports = router;
