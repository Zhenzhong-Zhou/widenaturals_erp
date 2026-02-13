const express = require('express');
const { authorize } = require('../middlewares/authorize');
const PERMISSIONS = require('../utils/constants/domain/permissions');
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
  authorize([PERMISSIONS.LOCATIONS.VIEW]),
  getAllLocationsController
);

module.exports = router;
