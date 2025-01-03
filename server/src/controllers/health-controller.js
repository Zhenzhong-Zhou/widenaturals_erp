/**
 * @file health-controller.js
 * @description Contains the logic for the health check route.
 */

const { testConnection } = require('../database/db'); // Database utility for health checks

/**
 * GET /
 * Handles health check requests.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const getHealthStatus = async (req, res) => {
  try {
    await testConnection(); // Test database connectivity
    res.status(200).json({
      status: 'Healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      status: 'Unhealthy',
      error: error.message,
    });
  }
};

module.exports = { getHealthStatus };
