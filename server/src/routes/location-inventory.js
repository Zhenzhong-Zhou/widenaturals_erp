const express = require('express');
const {
  getLocationInventorySummaryController,
  createInventoryRecordsController,
} = require('../controllers/location-inventory-controller');

const router = express.Router();

/**
 * @route GET /api/v1/location-inventory/summary
 * @desc Fetch paginated location inventory summary (products and materials)
 * @access Private
 */
router.get('/summary', getLocationInventorySummaryController);

router.post('/add-inventory-records', createInventoryRecordsController);

module.exports = router;
