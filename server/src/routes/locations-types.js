const express = require('express');
const { authorize } = require('../middlewares/authorize');
const {
  getLocationTypesController,
  getLocationTypeDetailController,
} = require('../controllers/location-type-controller');
const PERMISSIONS = require('../utils/constants/domain/permissions');

const router = express.Router();

/**
 * @desc    Fetch all location types (Paginated)
 * @route   GET /api/location-types
 * @access  Protected
 */
router.get(
  '/',
  authorize([PERMISSIONS.LOCATIONS_TYPES.VIEW]),
  getLocationTypesController
);

/**
 * GET /location-types/:id
 * Fetch location type details by ID.
 */
router.get(
  '/:id',
  authorize([PERMISSIONS.LOCATIONS_TYPES.VIEW_DETAILS]),
  getLocationTypeDetailController
);

module.exports = router;
