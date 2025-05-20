const express = require('express');
const {
  getLocationInventorySummaryController,
  getLocationInventorySummaryDetailsController,
  createInventoryRecordsController,
} = require('../controllers/location-inventory-controller');

const router = express.Router();

/**
 * @route GET /api/v1/location-inventory/summary
 * @desc Fetch paginated location inventory summary (products and materials)
 * @access Private
 */
router.get('/summary', getLocationInventorySummaryController);

/**
 * @route GET /location-inventory/summary/:itemId/details
 * @group Location Inventory - Summary
 * @summary Get paginated location inventory summary details for a specific item (product SKU or packaging material).
 * @param {string} itemId.path.required - The ID of the SKU (product) or packaging material
 * @param {number} page.query.optional - Page number for pagination (default: 1)
 * @param {number} limit.query.optional - Number of records per page (default: 10)
 * @returns {object} 200 - Success response with paginated location inventory summary
 * @returns {object} 400 - Validation error if itemId is missing or invalid
 * @returns {object} 500 - Internal server error
 */
router.get('/summary/:itemId/details', getLocationInventorySummaryDetailsController);

router.post('/add-inventory-records', createInventoryRecordsController);

module.exports = router;
