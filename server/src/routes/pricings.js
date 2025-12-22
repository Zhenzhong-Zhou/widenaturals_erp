/**
 * @file pricing.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const {
  getPaginatedPricingRecordsController,
  getPricingDetailsController,
  exportPricingRecordsController,
} = require('../controllers/pricing-controller');

const router = express.Router();

// Route for getting all users
router.get(
  '/',
  authorize(['view_prices', 'manage_prices']),
  getPaginatedPricingRecordsController
);

router.get(
  '/export',
  authorize(['export_pricing', 'manage_prices']),
  exportPricingRecordsController
);

router.get(
  '/by-type/:id/details',
  authorize(['view_prices', 'manage_prices']),
  getPricingDetailsController
);

module.exports = router;
