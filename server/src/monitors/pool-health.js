/**
 * @file pool-monitor.js
 * @description Utilities for monitoring the database connection pool.
 */

const {
  logSystemWarn,
  logSystemInfo,
  logSystemException,
} = require('../utils/system-logger');
const { ONE_MINUTE } = require('../utils/constants/general/time');

let monitorPool;
setImmediate(() => {
  monitorPool = require('../database/db').monitorPool;
});

let monitoringIntervalId = null;

/**
 * Starts periodic monitoring of the connection pool.
 * Logs pool metrics at a regular interval.
 * @param {number} [interval=60000] - Interval in milliseconds for monitoring.
 */
const startPoolMonitoring = (
  interval = parseInt(process.env.POOL_MONITOR_INTERVAL, 10) || ONE_MINUTE
) => {
  if (isNaN(interval) || interval <= 0) {
    logSystemWarn('Invalid monitoring interval. Defaulting to 60000ms.', {
      context: 'pool-monitor',
      originalValue: process.env.POOL_MONITOR_INTERVAL,
      fallback: ONE_MINUTE,
    });
    interval = ONE_MINUTE; // Default to 1 minute
  }

  if (monitoringIntervalId) {
    logSystemWarn('Pool monitoring is already running. Restarting...', {
      context: 'pool-monitor',
    });
    clearInterval(monitoringIntervalId);
  }

  logSystemInfo('Starting pool monitoring', {
    context: 'pool-monitor',
    interval,
  });

  monitoringIntervalId = setInterval(() => {
    try {
      const metrics = monitorPool();
      logSystemInfo('Pool monitoring metrics', {
        context: 'pool-monitor',
        metrics,
      });
    } catch (error) {
      logSystemException(error, 'Error during pool monitoring', {
        context: 'pool-monitor',
      });
    }
  }, interval);
};

/**
 * Stops monitoring the database connection pool.
 */
const stopPoolMonitoring = () => {
  if (monitoringIntervalId) {
    clearInterval(monitoringIntervalId);
    monitoringIntervalId = null;
    logSystemInfo('Pool monitoring stopped', {
      context: 'pool-monitor',
    });
  } else {
    logSystemWarn('Pool monitoring was not running; no action taken', {
      context: 'pool-monitor',
    });
  }
};

/**
 * Checks if pool monitoring is running.
 * @returns {boolean} - True if monitoring is active.
 */
const isPoolMonitoringRunning = () => monitoringIntervalId !== null;

module.exports = {
  startPoolMonitoring,
  stopPoolMonitoring,
  isPoolMonitoringRunning,
};
