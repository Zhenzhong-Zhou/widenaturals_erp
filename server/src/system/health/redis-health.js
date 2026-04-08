/**
 * @file redis-health.js
 * @description Redis health check utilities.
 *
 * Responsibilities:
 * - Validate Redis connection readiness
 * - Provide lightweight health status for observability
 *
 * Design Principles:
 * - Must be fast and non-blocking (no network calls)
 * - Must throw on failure (health contract)
 * - Must not perform logging (handled by health runner)
 */

const { isRedisReady } = require('../../utils/redis-client');
const AppError = require('../../utils/AppError');

const CONTEXT = 'health/redis';

/**
 * Checks Redis connection readiness.
 *
 * NOTE:
 * - Uses client state only (no Redis commands)
 * - Safe for frequent execution
 *
 * @returns {Object} Redis health metadata
 * @throws {AppError} When Redis is not ready
 */
const checkRedisHealth = () => {
  //--------------------------------------------------
  // Validate readiness
  //--------------------------------------------------
  const ready = isRedisReady();
  
  if (!ready) {
    throw AppError.healthCheckError('Redis is not ready', {
      context: CONTEXT,
      subtype: 'RedisNotReady',
    });
  }
  
  //--------------------------------------------------
  // Return snapshot (no logging)
  //--------------------------------------------------
  return {
    status: 'healthy',
    ready: true,
  };
};

module.exports = {
  checkRedisHealth,
};
