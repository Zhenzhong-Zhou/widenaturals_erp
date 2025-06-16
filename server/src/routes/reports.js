const express = require('express');
const { getInventoryActivityLogsController } = require('../controllers/report-controller');
const authorize = require('../middlewares/authorize');
const { sanitizeInput } = require('../middlewares/sanitize');

const router = express.Router();

/**
 * GET /inventory-activity-logs
 *
 * Requires basic permission: 'view_inventory_logs'.
 * More granular access (e.g., per-warehouse or role-level filtering)
 * is enforced inside `fetchInventoryActivityLogsService`.
 *
 * Accepts optional query parameters:
 *   - fromDate, toDate
 *   - warehouseIds[], locationIds[]
 *   - skuIds[], productIds[]
 *   - actionTypeIds[], adjustmentTypeId
 *
 * Logs and filters access attempts in audit log.
 */
router.get(
  '/inventory-activity-logs',
  authorize([
    'view_inventory_logs'
  ]),
  sanitizeInput,
  getInventoryActivityLogsController
);

module.exports = router;
