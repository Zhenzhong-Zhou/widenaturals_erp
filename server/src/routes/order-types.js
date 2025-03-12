const express = require('express');
const { getOrderTypesController, getOrderTypesDropdownController } = require('../controllers/order-type-controller');

const router = express.Router();

/**
 * @route GET /api/v1/order-types
 * @desc Fetch all order types
 * @access Private
 */
router.get('/', getOrderTypesController);

router.get('/dropdown', getOrderTypesDropdownController);

module.exports = router;
