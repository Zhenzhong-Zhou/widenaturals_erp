/**
 * @file health-check.js
 * @description Schedules and manages periodic health checks for the application.
 */

const { logSystemWarn, logSystemError, logSystemInfo, logSystemException } = require('../utils/system-logger');
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
    logSystemWarn('Health check already running. Restarting...', {
      context: 'health-monitor',
    });
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
            return {
              name: healthCheck.name,
              status: 'healthy',
              details: result,
            };
          } catch (error) {
            logSystemError(`Health check failed: ${healthCheck.name}`, {
              context: 'health-monitor',
              check: healthCheck.name,
              errorMessage: error.message,
              stack: process.env.NODE_ENV !== 'production' ? error.stack : undefined,
            });
            
            return {
              name: healthCheck.name,
              status: 'unhealthy',
              error: error.message,
            };
          }
        })
      );

      const duration = Date.now() - startTime;
      
      logSystemInfo('Scheduled health check completed.', {
        context: 'health-monitor',
        durationMS: duration,
        results,
      });
    } catch (error) {
      logSystemException(error, 'Unexpected failure during scheduled health check', {
        context: 'health-monitor',
      });
    }
  }, interval);
  
  logSystemInfo('Health check interval initialized.', {
    context: 'health-monitor',
    intervalMs: interval,
  });
};

/**
 * Stops periodic health checks.
 */
const stopHealthCheck = () => {
  if (healthCheckInterval) {
    clearInterval(healthCheckInterval);
    healthCheckInterval = null;
    
    logSystemInfo('Health check stopped', {
      context: 'health-monitor',
      action: 'stop',
      status: 'stopped',
    });
  } else {
    logSystemWarn('Health check is not running', {
      context: 'health-monitor',
      action: 'stop',
      status: 'not_running',
    });
  }
};

module.exports = {
  startHealthCheck,
  stopHealthCheck
};
