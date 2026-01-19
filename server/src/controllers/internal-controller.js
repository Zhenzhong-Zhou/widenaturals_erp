const { checkServerHealthService } = require('../services/server-health-service');
const AppError = require('../utils/AppError');
const wrapAsync = require('../utils/wrap-async');

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
const getInternalStatus = wrapAsync(async (req, res, next) => {
  try {
    // Perform server health checks
    const healthMetrics = await checkServerHealthService();

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
});

// TODO: 1. Do you need cacheSession now?
// No — not now. Do NOT add it yet.
//
// Given your current design:
//
// ❌ No session table
//
// ❌ No Redis-backed session store
//
// ✅ Stateless access token
//
// ✅ Refresh token only
//
// ✅ ERP internal system
//
// Adding cacheSession now would be premature abstraction.
//
// Why it’s not needed yet
//
// You are not:
//
// revoking sessions centrally
//
// tracking concurrent logins
//
// enforcing device limits
//
// invalidating refresh tokens server-side
//
// Redis would be unused complexity
//
// You would introduce:
//
// extra failure surface
//
// misleading “session” semantics
//
// Correct decision
//
// ✅ Defer cacheSession
// 📝 Keep it as a future pattern, not implementation.
//
// Rule:
// Do not introduce Redis session logic until you actually need server-side state.

const cacheSession = async (sessionId, payload) => {
  const redis = getRedisClient();
  
  if (!redis) {
    throw new Error('Redis not initialized');
  }
  
  await redis.setex(
    `session:${sessionId}`,
    3600,
    JSON.stringify(payload)
  );
};

// TODO: Admin health
const checkRedisHealth = async () => {
  const redis = getRedisClient();
  
  if (!redis) {
    return { status: 'unhealthy' };
  }
  
  try {
    await redis.ping();
    return { status: 'healthy' };
  } catch {
    return { status: 'unhealthy' };
  }
};

module.exports = { getInternalStatus };
