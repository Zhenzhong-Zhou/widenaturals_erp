const express = require('express');
const { fetchOrderTypesController } = require('../controllers/order-type-controller');

const router = express.Router();

/**
 * @route GET /api/v1/order-types
 * @desc Fetch all order types
 * @access Private
 */
router.get('/', fetchOrderTypesController);

module.exports = router;
