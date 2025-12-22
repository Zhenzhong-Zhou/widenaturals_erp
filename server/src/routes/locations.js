const express = require('express');
const { authorize } = require('../middlewares/authorize');
const {
  getAllLocationsController,
} = require('../controllers/location-controller');

const router = express.Router();

/**
 * @route GET /api/v1/locations
 * @desc Fetch all locations with pagination & sorting
 * @access Protected
 */
router.get(
  '/',
  authorize(['manage_locations', 'view_locations']),
  getAllLocationsController
);

module.exports = router;
