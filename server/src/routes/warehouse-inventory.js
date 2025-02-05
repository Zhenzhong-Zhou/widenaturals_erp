const express = require('express');
const { getAllWarehouseInventoriesController } = require('../controllers/warehouse-inventory-controller');

const router = express.Router();

// GET /api/warehouse-inventory - Fetch all warehouse inventory with pagination
router.get('/', getAllWarehouseInventoriesController);

module.exports = router;
