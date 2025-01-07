/**
 * @file public-controller.js
 * @description Contains the logic for the public routes: Welcome and Health Check.
 */

const { logInfo, logError, logDebug } = require('../utils/logger-helper');
const { version } = require('../../package.json'); // Dynamically fetch version from package.json
const { testConnection } = require('../database/db');
const { generateSecret } = require('../utils/crypto-utils');

/**
 * GET /public/welcome
 * Handles requests to the welcome route and provides basic API information.
 *
 * @function getWelcomeMessage
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Object} JSON response with API information.
 */
const getWelcomeMessage = (req, res) => {
  // Load API prefix from environment variables
  const API_PREFIX = process.env.API_PREFIX;

  logInfo('Serving welcome message to the client', req);
  
  res.status(200).json({
    message: 'Welcome to WIDE Naturals Inc. ERP API!',
    documentation: '/docs', // Link to API documentation
    statusEndpoint: `${API_PREFIX}/public/health`, // Updated to match the new route structure
    version,
    frontendVersion: process.env.FRONTEND_VERSION,
    system: 'WIDE Naturals Inc. ERP',
    timestamp: new Date().toISOString(),
  });
};

/**
 * GET /public/health
 * Handles health check requests.
 *
 * @function getHealthStatus
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Object} JSON response with API health status.
 */
const getHealthStatus = async (req, res) => {
  try {
    logInfo('Checking API health status...');
    await testConnection(); // Ensures database connectivity
    res.status(200).json({
      status: 'Healthy',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logError('API health check failed', req, { error: error.message });
    res.status(500).json({
      status: 'Unhealthy',
      error: error.message,
    });
  }
};

module.exports = { getWelcomeMessage, getHealthStatus };
