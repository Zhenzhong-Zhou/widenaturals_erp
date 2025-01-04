/**
 * @file welcome-controller.js
 * @description Contains the logic for the welcome route.
 * Provides general information about the API, including health status and documentation links.
 */

const { version } = require('../../package.json'); // Dynamically fetch version from package.json

/**
 * GET /
 * Handles requests to the root route and provides basic API information.
 *
 * @function getWelcomeMessage
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @returns {Object} JSON response with API information.
 *
 * Example Response:
 * {
 *   "message": "Welcome to the API!",
 *   "documentation": "/docs",
 *   "statusEndpoint": "/api/v1/health",
 *   "version": "1.0.0",
 *   "timestamp": "2025-01-02T12:00:00.000Z"
 * }
 */
const getWelcomeMessage = (req, res) => {
  // Load API prefix from environment variables
  const API_PREFIX = process.env.API_PREFIX;
  
  // Construct response
  res.status(200).json({
    message: 'Welcome to WIDE Naturals Inc. ERP API!',
    documentation: '/docs', // Link to API documentation
    statusEndpoint: `${API_PREFIX}/health`, // Endpoint to check API health
    version, // Dynamically fetched API version
    frontendVersion: process.env.FRONTEND_VERSION || '1.0.0', // Frontend version from environment
    system: 'WIDE Naturals Inc. ERP', // Identify the system/application
    timestamp: new Date().toISOString(), // Current timestamp
  });
};

module.exports = { getWelcomeMessage };
