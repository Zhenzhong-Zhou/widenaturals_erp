const { checkServerHealth } = require('../monitors/server-health');
const AppError = require('../utils/AppError');

/**
 * GET /internal/status
 * Provides detailed system and service status for internal use.
 *
 * @function getInternalStatus
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {Object} JSON response with system and service status.
 */
const getInternalStatus = async (req, res, next) => {
  try {
    // Perform server health checks
    const healthMetrics = await checkServerHealth();

    res.status(200).json({
      server: healthMetrics.server,
      services: healthMetrics.services,
      timestamp: healthMetrics.metrics.timestamp,
    });
  } catch (error) {
    // Pass the error to the next middleware
    return next(
      AppError.healthCheckError('Health check failed', {
        details: error.message,
        code: 'HEALTH_CHECK_FAILURE',
      })
    );
  }
};

module.exports = { getInternalStatus };
