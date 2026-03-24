/**
 * @file redis-client.js
 * @description Redis client lifecycle management.
 *
 * Responsibilities:
 * - Lazily create and manage a Redis client instance
 * - Provide controlled connect/disconnect lifecycle
 * - Ensure safe concurrent connection attempts
 * - Expose read-only access to connection state
 *
 * Design Principles:
 * - No side effects on import
 * - Idempotent connect/disconnect operations
 * - Explicit lifecycle control by application bootstrap
 * - Safe concurrency via shared connection promise
 */

const Redis = require('ioredis');
const {
  logSystemInfo,
  logSystemError,
} = require('./logging/system-logger');

const CONTEXT = 'system/redis-client';

let redisClient = null;
let connectingPromise = null;

/**
 * Creates a Redis client instance (without connecting).
 *
 * @returns {Redis} ioredis client instance
 */
const createRedisClient = () => {
  return new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    
    lazyConnect: true,
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  });
};

/**
 * Establishes a Redis connection.
 *
 * Guarantees:
 * - Only one connection attempt runs at a time
 * - Reuses existing client if already connected
 * - Fails fast and resets state on error
 *
 * @returns {Promise<Redis>} Connected Redis client
 */
const connectRedis = async () => {
  //--------------------------------------------------
  // Already connected
  //--------------------------------------------------
  if (redisClient?.status === 'ready') {
    return redisClient;
  }
  
  //--------------------------------------------------
  // Connection in progress
  //--------------------------------------------------
  if (connectingPromise) {
    return connectingPromise;
  }
  
  //--------------------------------------------------
  // Create new client
  //--------------------------------------------------
  redisClient = createRedisClient();
  
  //--------------------------------------------------
  // Attach event listeners ONCE per instance
  //--------------------------------------------------
  redisClient.once('connect', () => {
    logSystemInfo('Redis connected', { context: CONTEXT });
  });
  
  redisClient.on('error', (err) => {
    logSystemError('Redis error', {
      context: CONTEXT,
      message: err.message,
      stack: err.stack,
    });
  });
  
  //--------------------------------------------------
  // Controlled connection attempt
  //--------------------------------------------------
  connectingPromise = (async () => {
    try {
      await redisClient.connect();
      return redisClient;
    } catch (error) {
      logSystemError('Failed to connect to Redis', {
        context: CONTEXT,
        message: error.message,
        stack: error.stack,
      });
      
      redisClient = null;
      throw error;
    } finally {
      connectingPromise = null;
    }
  })();
  
  return connectingPromise;
};

/**
 * Disconnects Redis gracefully.
 *
 * Guarantees:
 * - Safe to call multiple times (idempotent)
 * - Handles partially connected states
 */
const disconnectRedis = async () => {
  if (!redisClient) return;
  
  try {
    //--------------------------------------------------
    // Only quit if connection is active
    //--------------------------------------------------
    if (redisClient.status === 'ready') {
      await redisClient.quit();
      logSystemInfo('Redis disconnected', { context: CONTEXT });
    } else {
      // Force cleanup if not fully connected
      redisClient.disconnect();
    }
  } catch (error) {
    logSystemError('Redis disconnect failed', {
      context: CONTEXT,
      message: error.message,
    });
  } finally {
    redisClient = null;
  }
};

/**
 * Returns the active Redis client instance.
 *
 * NOTE:
 * - Does NOT create or connect Redis
 * - May return null if not initialized
 *
 * @returns {Redis|null}
 */
const getRedisClient = () => redisClient;

/**
 * Indicates whether Redis is connected and ready.
 *
 * @returns {boolean}
 */
const isRedisReady = () => redisClient?.status === 'ready';

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisReady,
};
