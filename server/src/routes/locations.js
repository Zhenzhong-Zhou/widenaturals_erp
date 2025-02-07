const express = require('express');
const { getAllLocationsController } = require('../controllers/location-controller');

const router = express.Router();

/**
 * @route GET /api/v1/locations
 * @desc Fetch all locations with pagination & sorting
 * @access Protected
 */
router.get('/', getAllLocationsController);

module.exports = router;
