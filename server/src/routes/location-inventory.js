const express = require('express');
const {
  getLocationInventorySummaryController,
  getLocationInventorySummaryDetailsController,
  createInventoryRecordsController,
} = require('../controllers/location-inventory-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

/**
 * @route GET /location-inventory/summary
 * @group Location Inventory - Summary
 * @description Returns a paginated summary of location-based inventory (products and materials),
 * grouped by SKU or material code. Supports optional filters for item type.
 *
 * @access Protected
 * @permission view_location_inventory - Required to view location inventory summaries.
 * @param {string} itemType.query.optional - Optional filter: 'product', 'material', or 'all'
 * @param {number} page.query.optional - Page number (default: 1)
 * @param {number} limit.query.optional - Number of records per page (default: 10)
 * @returns {object} 200 - Paginated inventory summary
 * @returns {object} 403 - Forbidden if missing required permissions
 */
router.get('/summary',
  authorize([
    'view_inventory',
    'view_location_inventory',
    'view_inventory_summary'
  ]),
  getLocationInventorySummaryController);

/**
 * @route GET /location-inventory/summary/:itemId/details
 * @group Location Inventory - Summary
 * @summary Get paginated location inventory summary details for a specific item (product SKU or packaging material).
 * @param {string} itemId.path.required - The ID of the SKU (product) or packaging material
 * @param {number} page.query.optional - Page number for pagination (default: 1)
 * @param {number} limit.query.optional - Number of records per page (default: 10)
 * @returns {object} 200 - Success response with paginated location inventory summary
 * @returns {object} 400 - Validation error if itemId is missing or invalid
 * @returns {object} 403 - Forbidden if permission is missing
 * @returns {object} 500 - Internal server error
 * @permission view_location_inventory - Required to access location inventory summary
 */
router.get('/summary/:itemId/details',
  authorize([
    'view_inventory',
    'view_location_inventory',
    'view_product_inventory',
    'view_material_inventory'
  ]),
  getLocationInventorySummaryDetailsController);

router.post('/add-inventory-records', createInventoryRecordsController);

module.exports = router;
