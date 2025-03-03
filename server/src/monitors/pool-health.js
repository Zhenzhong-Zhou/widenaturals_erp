/**
 * @file pool-monitor.js
 * @description Utilities for monitoring the database connection pool.
 */

const { logInfo, logError, logWarn } = require('../utils/logger-helper');
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
    logError(
      `Invalid monitoring interval: ${interval}. Defaulting to 60000ms.`
    );
    interval = ONE_MINUTE; // Default to 1 minute
  }

  if (monitoringIntervalId) {
    logWarn('Pool monitoring is already running. Restarting...');
    clearInterval(monitoringIntervalId);
  }

  logInfo(`Starting pool monitoring with an interval of ${interval}ms`);

  monitoringIntervalId = setInterval(() => {
    try {
      const metrics = monitorPool();
      logInfo('Periodic pool monitoring metrics:', metrics);
    } catch (error) {
      logError('Error during pool monitoring:', { error: error.message });
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
    logInfo('Pool monitoring stopped.');
  } else {
    logWarn('Pool monitoring was not running; no action taken.');
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
