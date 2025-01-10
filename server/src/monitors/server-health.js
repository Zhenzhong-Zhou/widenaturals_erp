/**
 * @file server-health.js
 * @description Server health check and status monitoring.
 */

const { checkDatabaseHealth } = require('../monitors/db-health');

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
    status.services.database = await checkDatabaseHealth();
  } catch (error) {
    status.server = 'unhealthy';
    status.services.database = { status: 'unhealthy', error: error.message };
  }
  
  // Perform pool health check
  try {
    const poolMetrics = await monitorPool();
    status.services.pool = { status: 'healthy', metrics: poolMetrics };
  } catch (error) {
    status.server = 'unhealthy';
    status.services.pool = { status: 'unhealthy', error: error.message };
  }
  
  return status;
};

module.exports = { checkServerHealth };
