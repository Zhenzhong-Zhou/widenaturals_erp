const express = require('express');
const { getAllWarehousesController } = require('../controllers/warehouse-controller');

const router = express.Router();

// GET /api/warehouses - Fetch all warehouses with pagination
router.get('/', getAllWarehousesController);

module.exports = router;
