const express = require('express');
const {
  getLocationTypesController,
  getLocationTypeDetailController,
} = require('../controllers/location-type-controller');
const authorize = require('../middlewares/authorize');

const router = express.Router();

/**
 * @desc    Fetch all location types (Paginated)
 * @route   GET /api/location-types
 * @access  Protected
 */
router.get(
  '/',
  authorize(['manage_locations', 'view_locations']),
  getLocationTypesController
);

/**
 * GET /location-types/:id
 * Fetch location type details by ID.
 */
router.get(
  '/:id',
  authorize(['manage_locations', 'view_locations']),
  getLocationTypeDetailController
);

module.exports = router;
