/**
 * @file health.js
 * @description Health check routes to monitor API status.
 */

const express = require('express');
const { getHealthStatus } = require('../controllers/health-controller');

const router = express.Router();

// Health check route
router.get('/', getHealthStatus);

module.exports = router;
