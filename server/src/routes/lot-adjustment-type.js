const express = require('express');
const {
  getWarehouseLotAdjustmentTypesForDropdownController,
} = require('../controllers/lot-adjustment-type-controller');

const router = express.Router();

/**
 * @route GET /api/warehouse-lot-adjustments/dropdown
 * @desc Fetch all active warehouse lot adjustment types for dropdown
 * @access Private
 */
router.get('/dropdown', getWarehouseLotAdjustmentTypesForDropdownController);

module.exports = router;
