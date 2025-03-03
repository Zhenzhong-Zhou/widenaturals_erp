const express = require('express');
const {
  getWarehouseLotAdjustmentTypesController,
} = require('../controllers/lot-adjustment-type-controller');

const router = express.Router();

// GET /api/warehouse-lot-adjustments - Fetch all active warehouse lot adjustment types
router.get('/types', getWarehouseLotAdjustmentTypesController);

module.exports = router;
