const express = require('express');
const { authorize } = require('../middlewares/authorize');
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  inventoryActivityLogQuerySchema,
} = require('../validators/report-validators');
const {
  getInventoryActivityLogsController,
} = require('../controllers/report-controller');

const router = express.Router();

/**
 * GET /inventory-activity-logs
 *
 * Retrieves a paginated list of inventory activity logs with optional filters.
 *
 * Authorization:
 * - Requires the 'view_inventory_log' permission.
 * - Additional filtering and access control (e.g., warehouse-level, role-based) is enforced in the service layer.
 *
 * Middleware:
 * - Normalizes array and boolean query parameters
 * - Sanitizes raw string fields (e.g., sortBy, sourceType)
 * - Validates query parameters against the schema
 * - Logs access attempts in the audit log
 *
 * Supported query parameters:
 * - Pagination: page, limit
 * - Sorting: sortBy, sortOrder
 * - Date range: fromDate, toDate
 * - Filter arrays: warehouseIds[], locationIds[], productIds[], skuIds[], batchIds[], packagingMaterialIds[], actionTypeIds[]
 * - Filter scalars: orderId, statusId, adjustmentTypeId, performedBy, sourceType, batchType
 */
router.get(
  '/inventory-activity-logs',
  authorize(['view_inventory_log']),
  createQueryNormalizationMiddleware(
    'inventoryActivityLogSortMap',
    [
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
    [],
    inventoryActivityLogQuerySchema
  ),
  sanitizeFields(['sourceType', 'batchType', 'sortBy', 'sortOrder']),
  validate(
    inventoryActivityLogQuerySchema,
    'query',
    { convert: true },
    'Invalid inventory activity log query parameters.'
  ),
  getInventoryActivityLogsController
);

module.exports = router;
