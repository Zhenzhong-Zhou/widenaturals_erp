/**
 * @file server-health.js
 * @description Server health check and status monitoring.
 */

const { checkDatabaseHealth } = require('../monitors/db-health');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');

let monitorPool;
setImmediate(() => {
  monitorPool = require('../database/db').monitorPool;
});

/**
 * Performs a comprehensive server health check.
 * @returns {Promise<object>} - Server health status.
 */
const checkServerHealth = async () => {
  const status = {
    server: 'healthy',
    services: {
      database: null,
      pool: null,
    },
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    },
  };

  // Perform database health check
  try {
    const dbStatus = await checkDatabaseHealth();
    status.services.database = dbStatus;
    
    logSystemInfo('Database health check passed', {
      context: 'health-check',
      service: 'database',
      result: dbStatus,
    });
  } catch (error) {
    status.server = 'unhealthy';
    status.services.database = { status: 'unhealthy', error: error.message };
    
    logSystemException(error, 'Database health check failed', {
      context: 'health-check',
      service: 'database',
    });
  }

  // Perform pool health check
  try {
    const poolMetrics = await monitorPool();
    status.services.pool = { status: 'healthy', metrics: poolMetrics };
    
    logSystemInfo('Pool health check passed', {
      context: 'health-check',
      service: 'pool',
      result: poolMetrics,
    });
  } catch (error) {
    status.server = 'unhealthy';
    status.services.pool = { status: 'unhealthy', error: error.message };
    
    logSystemException(error, 'Pool health check failed', {
      context: 'health-check',
      service: 'pool',
    });
  }

  return status;
};

module.exports = { checkServerHealth };
