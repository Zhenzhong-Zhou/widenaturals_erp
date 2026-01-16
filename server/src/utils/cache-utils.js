/**
 * @file cache-utils.js
 * @description Best-effort Redis cache helpers.
 *
 * IMPORTANT:
 * - Redis is treated as OPTIONAL infrastructure
 * - All operations are fail-safe and non-blocking
 * - Cache failures NEVER affect business correctness
 */

const { getRedisClient, isRedisReady } = require('./redis-client');
const { logSystemError } = require('./system-logger');

/**
 * Writes a value to Redis cache in a best-effort manner.
 *
 * Guarantees:
 * - NEVER throws
 * - NEVER blocks core logic
 * - Safe to call from auth, middleware, and critical paths
 *
 * Behavior:
 * - Skips silently if Redis is unavailable
 * - Logs errors without propagating
 *
 * @param {string} key - Cache key
 * @param {any} value - Serializable value to cache
 * @param {number} [ttlSeconds=3600] - Time-to-live in seconds
 * @returns {Promise<void>}
 */
const tryCacheWrite = async (key, value, ttlSeconds = 3600) => {
  if (!isRedisReady()) return;
  
  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    logSystemError('Redis cache write failed (ignored)', {
      key,
      message: error.message,
    });
  }
};

/**
 * Reads a value from Redis cache in a best-effort manner.
 *
 * Guarantees:
 * - NEVER throws
 * - NEVER blocks core logic
 *
 * Behavior:
 * - Returns null if Redis is unavailable
 * - Returns null on cache miss or parse failure
 *
 * @param {string} key - Cache key
 * @returns {Promise<any | null>} Cached value or null
 */
const tryCacheRead = async (key) => {
  if (!isRedisReady()) return null;
  
  try {
    const redis = getRedisClient();
    const cached = await redis.get(key);
    if (!cached) return null;
    
    return JSON.parse(cached);
  } catch (error) {
    logSystemError('Redis cache read failed (ignored)', {
      key,
      message: error.message,
    });
    return null;
  }
};

module.exports = {
  tryCacheWrite,
  tryCacheRead,
};
