/**
 * @file health.js
 * @description Health check routes to monitor API status.
 */

const express = require('express');
const { testConnection } = require('../database/db'); // Database utility for health checks

const router = express.Router();

// Health check route
router.get('/', async (req, res) => {
  try {
    await testConnection(); // Test database connectivity
    res.status(200).json({ status: 'Healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'Unhealthy', error: error.message });
  }
});

module.exports = router;
