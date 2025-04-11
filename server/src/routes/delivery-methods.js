const express = require('express');
const {
  getDeliveryMethodsForDropdownController,
} = require('../controllers/delivery-method-controller');

const router = express.Router();

router.get('/dropdown', getDeliveryMethodsForDropdownController);

module.exports = router;
