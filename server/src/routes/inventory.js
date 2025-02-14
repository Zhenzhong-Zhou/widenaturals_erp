const express = require('express');
const {
  getAllInventoriesController,
} = require('../controllers/inventory-controller');

const router = express.Router();

/**
 * @route GET api/v1/inventories
 * @desc Fetch all inventory items with pagination and sorting
 * @access Private
 */
router.get('/', getAllInventoriesController);

module.exports = router;
