/**
 * @file health-check.js
 * @description Schedules and manages periodic health checks for the application.
 */

const logger = require('../utils/logger');
const { checkDatabaseHealth } = require('./db-health');
const { monitorPool } = require('../database/db');
const { ONE_MINUTE } = require('../utils/constants/general/time');

let healthCheckInterval = null;

/**
 * Health check registry.
 * Add new health checks here for dynamic extensibility.
 */
const healthChecks = [
  { name: 'Database Health', check: checkDatabaseHealth },
  { name: 'Pool Monitoring', check: monitorPool },
];

/**
 * Starts periodic health checks.
 * @param {number} interval - Interval in milliseconds between health checks.
 */
const startHealthCheck = (interval = ONE_MINUTE) => {
  if (healthCheckInterval) {
    logger.warn('Health check already running. Restarting...');
    clearInterval(healthCheckInterval);
  }
  
  healthCheckInterval = setInterval(async () => {
    try {
      const startTime = Date.now();
      
      // Perform multiple health checks concurrently
      const results = await Promise.all(
        healthChecks.map(async (healthCheck) => {
          try {
            const result = await healthCheck.check();
            return { name: healthCheck.name, status: 'healthy', details: result };
          } catch (error) {
            logger.error(`Health check failed: ${healthCheck.name}`, {
              error: error.message,
              stack: error.stack,
            });
            return { name: healthCheck.name, status: 'unhealthy', error: error.message };
          }
        })
      );
      
      const duration = Date.now() - startTime;
      
      logger.info(`Scheduled health check completed in ${duration}ms`, {
        results,
      });
    } catch (error) {
      logger.error('Scheduled health check failed unexpectedly', {
        error: error.message,
        stack: error.stack,
      });
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
