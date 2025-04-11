const express = require('express');
const {
  createOrderController,
  getOrderDetailsController,
  getAllOrdersController,
  confirmOrderController,
} = require('../controllers/order-controller');

const router = express.Router();

/**
 * @route   POST /orders
 * @desc    Create a new order dynamically based on order type
 * @access  Private
 */
router.post('/order-types/:orderTypeId', createOrderController);

/**
 * @route GET /api/orders/sales-order/details/:id
 * @access Protected
 */
router.get('/sales-order/details/:id', getOrderDetailsController);

router.get('/', getAllOrdersController);

router.post('/:orderId/confirm', confirmOrderController);

module.exports = router;
