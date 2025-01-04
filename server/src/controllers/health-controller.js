/**
 * @file health-controller.js
 * @description Contains the logic for the health check route.
 */

const { testConnection } = require('../database/db');
const { logInfo, logError } = require('../utils/loggerHelper');

/**
 * GET /
 * Handles health check requests.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const getHealthStatus = async (req, res) => {
  try {
    logInfo('Checking API health status...');
    await testConnection();
    res.status(200).json({
      status: 'Healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError(error, req, { route: '/health' });
    res.status(500).json({
      status: 'Unhealthy',
      error: error.message,
    });
  }
};

module.exports = { getHealthStatus };
