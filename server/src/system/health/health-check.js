/**
 * @file health-check.js
 * @description Periodic health check scheduler.
 *
 * Responsibilities:
 * - Execute registered health checks at fixed intervals
 * - Prevent overlapping executions
 * - Aggregate and log results in a structured format
 *
 * Design Principles:
 * - Idempotent start/stop
 * - No overlapping executions
 * - Minimal logging noise (summary-focused)
 * - Health checks MUST be lightweight and fast
 */

const {
  logSystemInfo,
  logSystemException,
  logSystemWarn,
} = require('../../utils/logging/system-logger');
const { checkDatabaseHealth, checkPoolHealth } = require('./db-health');
const { checkRedisHealth } = require('./redis-health');
const { ONE_MINUTE } = require('../../utils/constants/general/time');
const AppError = require('../../utils/AppError');

const CONTEXT = 'system/health-check';

let healthCheckInterval = null;
let isRunning = false;

/**
 * Health check registry (extendable).
 * Each check MUST:
 * - be fast
 * - not throw for expected failures (handled inside)
 */
const healthChecks = [
  { name: 'db_pool', check: checkPoolHealth },
  { name: 'database', check: checkDatabaseHealth },
  { name: 'redis', check: checkRedisHealth },
];

/**
 * Executes all health checks safely.
 */
const runHealthChecks = async () => {
  if (isRunning) {
    // Skip overlapping run
    return;
  }
  
  isRunning = true;
  
  const startTime = Date.now();
  
  try {
    const results = await Promise.all(
      healthChecks.map(async ({ name, check }) => {
        try {
          const result = await check();
          
          return {
            name,
            status: 'healthy',
            details: result,
          };
          
        } catch (error) {
          //--------------------------------------------------
          // Expected failure (AppError)
          //--------------------------------------------------
          if (error instanceof AppError) {
            logSystemWarn(`Health check failed: ${name}`, {
              context: CONTEXT,
              check: name,
              message: error.message,
              type: error.type,
              subtype: error.subtype,
            });
            
            return {
              name,
              status: 'unhealthy',
              message: error.message,
              type: error.type,
              subtype: error.subtype,
            };
          }
          
          //--------------------------------------------------
          // Unexpected failure
          //--------------------------------------------------
          logSystemException(error, `Unexpected health check error: ${name}`, {
            context: CONTEXT,
            check: name,
          });
          
          return {
            name,
            status: 'unhealthy',
            message: 'Unexpected error',
          };
        }
      })
    );
    
    const duration = Date.now() - startTime;
    
    //--------------------------------------------------
    // Log only summary (avoid heavy logs)
    //--------------------------------------------------
    const unhealthy = results.filter(r => r.status !== 'healthy');
    
    logSystemInfo('Health check completed', {
      context: CONTEXT,
      durationMs: duration,
      totalChecks: results.length,
      unhealthyCount: unhealthy.length,
    });
    
  } catch (error) {
    logSystemException(
      error,
      'Unexpected failure during health check',
      { context: CONTEXT }
    );
  } finally {
    isRunning = false;
  }
};

/**
 * Starts periodic health checks.
 *
 * @param {number} interval - Interval in milliseconds
 */
const startHealthCheck = (interval = ONE_MINUTE) => {
  if (healthCheckInterval) {
    return; // idempotent start
  }
  
  healthCheckInterval = setInterval(runHealthChecks, interval);
  
  logSystemInfo('Health check started', {
    context: CONTEXT,
    intervalMs: interval,
  });
};

/**
 * Stops periodic health checks.
 *
 * Safe to call multiple times.
 */
const stopHealthCheck = () => {
  if (!healthCheckInterval) return;
  
  clearInterval(healthCheckInterval);
  healthCheckInterval = null;
  
  logSystemInfo('Health check stopped', {
    context: CONTEXT,
  });
};

module.exports = {
  startHealthCheck,
  stopHealthCheck,
};
