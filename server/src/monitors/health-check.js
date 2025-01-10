/**
 * @file health-check.js
 * @description Schedules and manages periodic health checks for the application.
 */

const logger = require('../utils/logger');
const checkDatabaseHealth = require('./db-health');
const { monitorPool } = require('../database/db');

let healthCheckInterval = null;

/**
 * Starts periodic health checks.
 * @param {number} interval - Interval in milliseconds between health checks.
 */
const startHealthCheck = (interval = 60000) => {
  if (healthCheckInterval) {
    logger.warn('Health check already running. Restarting...');
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      const startTime = Date.now();
      
      // Perform multiple health checks concurrently
      const [databaseHealth, poolMetrics] = await Promise.all([
        checkDatabaseHealth(),
        monitorPool(), // Retrieve pool metrics
      ]);
      
      const duration = Date.now() - startTime;
      
      logger.info(`Scheduled health check succeeded in ${duration}ms`, {
        databaseHealth,
        poolMetrics,
      });
    } catch (error) {
      logger.error('Scheduled health check failed', { error: error.message });
    }
  }, interval);
  
  logger.info(`Health check started with an interval of ${interval} ms`);
};

/**
 * Stops periodic health checks.
 */
const stopHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    logger.info('Health check stopped');
  } else {
    logger.warn('Health check is not running');
  }
};

module.exports = { startHealthCheck, stopHealthCheck };
