const { checkServerHealth } = require('../monitors/server-health');
const { healthCheckError } = require('../utils/app-error');

/**
 * GET /system/status
 * Provides comprehensive system health status.
 *
 * @function getSystemStatus
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with system health status.
 */
const getSystemStatus = async (req, res, next) => {
  try {
    const startTime = Date.now(); // Track start time
    const status = await checkServerHealth();
    const duration = Date.now() - startTime; // Calculate duration

    const statusCode = status.server === 'healthy' ? 200 : 503; // Set appropriate status code

    res.status(statusCode).json({
      ...status,
      requestId: req.headers['x-request-id'] || null, // Optional request context
      responseTime: `${duration}ms`, // Optional response time
    });
  } catch (error) {
    return next(
      healthCheckError('Health check failed', {
        details: error.message,
        code: 'HEALTH_CHECK_FAILURE',
      })
    );
  }
};

module.exports = { getSystemStatus };
