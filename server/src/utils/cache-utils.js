/**
 * @file cache-utils.js
 * @description Best-effort Redis cache helpers.
 *
 * Design intent:
 *  - Redis is treated as optional infrastructure — the app runs correctly without it.
 *  - All operations are fail-safe and non-blocking; cache failures never affect
 *    business logic or request correctness.
 *  - Errors are logged for observability but never propagated to callers.
 *
 * Depends on:
 *  - getRedisClient / isRedisReady (redis-client.js) — connection and readiness check
 *  - logSystemError (system-logger.js)               — structured error logging on failure
 */

const { getRedisClient, isRedisReady } = require('./redis-client');
const { logSystemError } = require('./logging/system-logger');

/**
 * Writes a value to Redis cache in a best-effort manner.
 *
 * Guarantees:
 *  - Never throws
 *  - Never blocks core logic
 *  - Safe to call from auth, middleware, and any critical path
 *
 * Behavior:
 *  - Skips silently if Redis is unavailable
 *  - Logs errors without propagating them
 *
 * @param {string} key              - Cache key.
 * @param {any}    value            - JSON-serializable value to store.
 * @param {number} [ttlSeconds=3600] - Time-to-live in seconds (default: 1 hour).
 * @returns {Promise<void>}
 */
const tryCacheWrite = async (key, value, ttlSeconds = 3600) => {
  if (!isRedisReady()) return;

  try {
    const redis = getRedisClient();
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    logSystemError('Redis cache write failed (ignored)', {
      context: 'tryCacheWrite',
      key,
      error, // pass full error, not just message, for stack trace visibility
    });
  }
};

/**
 * Reads and deserializes a value from Redis cache in a best-effort manner.
 *
 * Guarantees:
 *  - Never throws
 *  - Never blocks core logic
 *
 * Behavior:
 *  - Returns null if Redis is unavailable
 *  - Returns null on cache miss
 *  - Returns null on JSON parse failure (logs separately to distinguish from Redis errors)
 *
 * @param {string} key - Cache key.
 * @returns {Promise<any|null>} Deserialized cached value, or null on miss/failure.
 */
const tryCacheRead = async (key) => {
  if (!isRedisReady()) return null;

  try {
    const redis = getRedisClient();
    const cached = await redis.get(key);

    if (!cached) return null; // cache miss — normal, not an error

    // Parse separately so a corrupted value doesn't look like a Redis failure in logs
    try {
      return JSON.parse(cached);
    } catch (parseError) {
      logSystemError('Redis cache value failed to parse (ignored)', {
        context: 'tryCacheRead',
        key,
        error: parseError,
      });
      return null;
    }
  } catch (error) {
    logSystemError('Redis cache read failed (ignored)', {
      context: 'tryCacheRead',
      key,
      error,
    });
    return null;
  }
};

module.exports = {
  tryCacheWrite,
  tryCacheRead,
};
