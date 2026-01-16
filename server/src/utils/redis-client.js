/**
 * @file redis-client.js
 * @description Redis client lifecycle management.
 *
 * Responsibilities:
 * - Create a single Redis client instance
 * - Explicitly control connection and disconnection
 * - Provide safe access to the active client
 *
 * IMPORTANT:
 * - This module MUST NOT load environment variables
 * - This module MUST NOT connect at import time
 * - Redis lifecycle is controlled by application bootstrap
 */

const Redis = require('ioredis');
const {
  logSystemInfo,
  logSystemError,
} = require('../utils/system-logger');

let redisClient = null;
let connectingPromise = null;

/**
 * Create Redis client instance (does NOT auto-connect).
 */
const createRedisClient = () => {
  return new Redis({
    host: process.env.REDIS_HOST ?? 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    
    // Secure in production
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
    
    // IMPORTANT: prevent implicit connection
    lazyConnect: true,
    
    // Prevent infinite retry loops
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
  });
};

/**
 * Connect to Redis explicitly.
 *
 * Guarantees:
 * - Only one client instance is created
 * - Concurrent calls share the same connection attempt
 * - Errors are surfaced to the caller
 */
const connectRedis = async () => {
  if (redisClient?.status === 'ready') {
    return redisClient;
  }
  
  if (connectingPromise) {
    return connectingPromise;
  }
  
  redisClient = createRedisClient();
  
  redisClient.on('connect', () => {
    logSystemInfo('Redis connected');
  });
  
  redisClient.on('error', (err) => {
    logSystemError('Redis error', {
      message: err.message,
      stack: err.stack,
    });
  });
  
  connectingPromise = (async () => {
    try {
      await redisClient.connect();
      return redisClient;
    } catch (error) {
      logSystemError('Failed to connect to Redis', {
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
 * Disconnect Redis cleanly.
 *
 * Safe to call multiple times.
 */
const disconnectRedis = async () => {
  if (!redisClient) return;
  
  try {
    await redisClient.quit();
    logSystemInfo('Redis disconnected');
  } catch (error) {
    logSystemError('Redis disconnect failed', {
      message: error.message,
    });
  } finally {
    redisClient = null;
  }
};

/**
 * Returns the active Redis client instance, if connected.
 *
 * IMPORTANT:
 * - This function MUST NOT create or connect Redis
 * - Callers must ensure Redis is initialized
 */
const getRedisClient = () => redisClient;

/**
 * Indicates whether Redis is connected and ready.
 *
 * Useful for:
 * - health checks
 * - feature gating
 * - diagnostics
 */
const isRedisReady = () =>
  redisClient?.status === 'ready';

module.exports = {
  connectRedis,
  disconnectRedis,
  getRedisClient,
  isRedisReady,
};
