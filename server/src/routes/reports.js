const express = require('express');
const {
  getAdjustmentReportController, getInventoryActivityLogsController,
} = require('../controllers/report-controller');

const router = express.Router();

/**
 * @route GET /api/v1/reports/adjustments
 * @desc Fetch paginated inventory adjustment reports with optional export.
 * @queryParam {string} reportType - 'daily', 'weekly', 'monthly', 'yearly', or 'custom'.
 * @queryParam {string} userTimezone - User's timezone for date conversion.
 * @queryParam {string} [startDate] - Start date for custom range (optional).
 * @queryParam {string} [endDate] - End date for custom range (optional).
 * @queryParam {string} [warehouseId] - Filter by warehouse ID (optional).
 * @queryParam {string} [inventoryId] - Filter by inventory ID (optional).
 * @queryParam {number} [page=1] - Page number for pagination (optional).
 * @queryParam {number} [limit=50] - Number of records per page (optional).
 * @queryParam {string} [sortBy='local_adjustment_date'] - Sorting field (optional).
 * @queryParam {string} [sortOrder='DESC'] - Sorting order: 'ASC' or 'DESC' (optional).
 * @queryParam {string} [exportFormat] - 'csv' or 'json' to export data (optional).
 * @access Private
 */
router.get('/adjustments', getAdjustmentReportController);

/**
 * @route GET /api/inventory/logs
 * @desc Fetch and export inventory logs.
 * @access Protected
 */
router.get('/inventory-activity-logs', getInventoryActivityLogsController);

module.exports = router;
