const express = require('express');
const {
  createOrderController,
  getOrderDetailsController,
} = require('../controllers/order-controller');

const router = express.Router();

/**
 * @route   POST /orders
 * @desc    Create a new order dynamically based on order type
 * @access  Private
 */
router.post('/:orderTypeId', createOrderController);

/**
 * @route GET /api/orders/:id
 * @access Protected
 */
router.get('/details/:id', getOrderDetailsController);

module.exports = router;
