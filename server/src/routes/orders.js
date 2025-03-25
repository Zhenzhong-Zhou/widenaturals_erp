const express = require('express');
const {
  createOrderController,
  getOrderDetailsController, getAllOrdersController,
} = require('../controllers/order-controller');

const router = express.Router();

/**
 * @route   POST /orders
 * @desc    Create a new order dynamically based on order type
 * @access  Private
 */
router.post('/order-types/:orderTypeId', createOrderController);

/**
 * @route GET /api/orders/:id
 * @access Protected
 */
router.get('/details/:id', getOrderDetailsController);


router.get('/', getAllOrdersController);

module.exports = router;
