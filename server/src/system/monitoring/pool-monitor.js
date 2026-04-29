/**
 * @file pool-monitor.js
 * @description Database connection pool monitoring utility.
 *
 * Responsibilities:
 * - Periodically collect pool metrics
 * - Emit structured logs based on system state
 * - Provide start/stop lifecycle control
 *
 * Design Principles:
 * - Dependency injection (monitorPoolFn)
 * - No log noise (metrics logged at DEBUG level)
 * - Signal-based logging (WARN on abnormal conditions)
 * - Safe scheduling (no overlapping executions)
 */

const {
  logSystemWarn,
  logSystemInfo,
  logSystemException,
  logSystemDebug,
} = require('../../utils/logging/system-logger');

const { ONE_MINUTE } = require('../../utils/constants/general/time');

const CONTEXT = 'monitoring/pool-monitor';

let monitoringIntervalId = null;
let isRunning = false;

/**
 * Starts periodic monitoring of the database connection pool.
 *
 * @param {Function} monitorPoolFn - Function returning pool metrics
 * @param {Object} [options]
 * @param {number} [options.interval] - Interval in ms
 */
const startPoolMonitoring = (monitorPoolFn, options = {}) => {
  const context = `${CONTEXT}/startPoolMonitoring`;

  //--------------------------------------------------
  // Validate dependency
  //--------------------------------------------------
  if (typeof monitorPoolFn !== 'function') {
    throw new Error('startPoolMonitoring: monitorPoolFn must be a function');
  }

  //--------------------------------------------------
  // Resolve interval
  //--------------------------------------------------
  const parsed = parseInt(process.env.POOL_MONITOR_INTERVAL, 10);
  let interval = options.interval ?? (isNaN(parsed) ? ONE_MINUTE : parsed);

  if (isNaN(interval) || interval <= 0) {
    logSystemWarn('Invalid monitoring interval. Using default.', {
      context,
      originalValue: process.env.POOL_MONITOR_INTERVAL,
      fallback: ONE_MINUTE,
    });
    interval = ONE_MINUTE;
  }

  //--------------------------------------------------
  // Restart if already running
  //--------------------------------------------------
  if (monitoringIntervalId) {
    logSystemWarn('Pool monitoring already running. Restarting...', {
      context,
    });
    stopPoolMonitoring();
  }

  logSystemInfo('Starting pool monitoring', {
    context,
    interval,
    status: 'started',
  });

  //--------------------------------------------------
  // Safe scheduler (no overlap)
  //--------------------------------------------------
  const run = () => {
    if (isRunning) return; // prevent overlap
    isRunning = true;

    try {
      const metrics = monitorPoolFn();

      //--------------------------------------------------
      // DEBUG: telemetry (no noise in production)
      //--------------------------------------------------
      logSystemDebug('Pool metrics snapshot', {
        context,
        metrics,
      });

      //--------------------------------------------------
      // WARN: signal-based alert
      //--------------------------------------------------
      if (metrics?.waitingRequests > 0) {
        logSystemWarn('Pool contention detected', {
          context,
          metrics,
        });
      }

      //--------------------------------------------------
      // WARN: saturation
      //--------------------------------------------------
      if (metrics.utilization > 0.9) {
        logSystemWarn('Pool saturation high', {
          context,
          utilization: metrics.utilization,
        });
      }
    } catch (error) {
      logSystemException(error, 'Pool monitoring error', {
        context,
      });
    } finally {
      isRunning = false;
    }
  };

  monitoringIntervalId = setInterval(run, interval);
};

/**
 * Stops pool monitoring safely.
 */
const stopPoolMonitoring = () => {
  const context = `${CONTEXT}/stopPoolMonitoring`;

  if (!monitoringIntervalId) {
    logSystemWarn('Pool monitoring not running', {
      context,
    });
    return;
  }

  clearInterval(monitoringIntervalId);
  monitoringIntervalId = null;

  logSystemInfo('Pool monitoring stopped', {
    context,
    status: 'stopped',
  });
};

/**
 * Indicates whether pool monitoring is active.
 *
 * @returns {boolean}
 */
const isPoolMonitoringRunning = () => monitoringIntervalId !== null;

module.exports = {
  startPoolMonitoring,
  stopPoolMonitoring,
  isPoolMonitoringRunning,
};
