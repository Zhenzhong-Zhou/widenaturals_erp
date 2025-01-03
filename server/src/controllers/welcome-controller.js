/**
 * @file welcome-controller.js
 * @description Contains the logic for the welcome route.
 */

/**
 * GET /
 * Handles requests to the root route.
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 */
const getWelcomeMessage = (req, res) => {
  const API_PREFIX = process.env.API_PREFIX;
  
  res.status(200).json({
    message: 'Welcome to the API!',
    documentation: '/docs',
    statusEndpoint: `${API_PREFIX}/health`,
    version: '1.0.0',
  });
};

module.exports = { getWelcomeMessage };
