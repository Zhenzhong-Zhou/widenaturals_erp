const express = require('express');
const {
  createOrderController,
  getOrderDetailsController,
  getAllOrdersController,
  confirmOrderController,
  getAllocationEligibleOrdersController,
  getAllocationEligibleOrderDetailsController,
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

router.get('/allocation-eligible', getAllocationEligibleOrdersController);

router.post('/:orderId/confirm', confirmOrderController);

router.get('/:orderId/allocation', getAllocationEligibleOrderDetailsController);

module.exports = router;
