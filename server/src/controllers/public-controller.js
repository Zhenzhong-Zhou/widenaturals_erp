/**
 * @file public-controller.js
 * @description Contains the logic for the public routes: Welcome and Health Check.
 */

const { logInfo, logError, logDebug } = require('../utils/logger-helper');
const { version } = require('../../package.json'); // Dynamically fetch version from package.json
const { checkServerHealth } = require('../monitors/server-health');

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
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with API health status.
 */
const getHealthStatus = async (req, res, next) => {
  try {
    logInfo('Checking API health status...', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString(),
    });

    // Perform server health check
    const healthStatus = await checkServerHealth();

    // Sanitize the response for public exposure
    const publicHealthStatus = {
      server: healthStatus.server,
      services: {
        database: { status: healthStatus.services.database.status },
        pool: { status: healthStatus.services.pool.status },
      },
      timestamp: healthStatus.metrics.timestamp, // Include a timestamp for transparency
    };

    const statusCode = healthStatus.server === 'healthy' ? 200 : 503;

    res.status(statusCode).json(publicHealthStatus);
  } catch (error) {
    logError('API health check failed', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      error: error.message,
      timestamp: new Date().toISOString(),
    });

    // Fallback response in case of unexpected failure
    res.status(503).json({
      server: 'unhealthy',
      message:
        'The server is currently experiencing issues. Please try again later.',
      timestamp: new Date().toISOString(),
    });

    // Call next middleware with the error for additional processing (optional)
    if (next) {
      next(error);
    }
  }
};

module.exports = { getWelcomeMessage, getHealthStatus };
