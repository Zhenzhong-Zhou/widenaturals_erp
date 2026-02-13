/**
 * @file pricing.js
 * @description Routes related to user operations.
 */

const express = require('express');
const { authorize } = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
const {
  getPaginatedPricingRecordsController,
  getPricingDetailsController,
  exportPricingRecordsController,
} = require('../controllers/pricing-controller');

const router = express.Router();

// Route for getting all users
router.get(
  '/',
  authorize([PERMISSIONS.PRICING.VIEW]),
  getPaginatedPricingRecordsController
);

router.get(
  '/export',
  authorize([PERMISSIONS.PRICING.EXPORT_DATA]),
  exportPricingRecordsController
);

router.get(
  '/by-type/:id/details',
  authorize([PERMISSIONS.PRICING.VIEW_DETAILS]),
  getPricingDetailsController
);

module.exports = router;
