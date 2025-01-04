/**
 * @file health.js
 * @description Health check routes to monitor API status.
 */

const express = require('express');
const { getHealthStatus } = require('../controllers/health-controller');
const wrapAsync = require('../utils/wrapAsync');

const router = express.Router();

// Health check route
router.get('/', wrapAsync(getHealthStatus));

module.exports = router;
