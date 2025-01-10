/**
 * @file server-health.js
 * @description Server health check and status monitoring.
 */

const { checkDatabaseHealth } = require('../monitors/db-health');

/**
 * Performs a comprehensive server health check.
 * @returns {Promise<object>} - Server health status.
 */
const checkServerHealth = async () => {
  const status = {
    server: 'healthy',
    services: {
      database: null,
    },
    metrics: {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    },
  };
  
  try {
    // Perform database health check
    status.services.database = await checkDatabaseHealth();
  } catch (error) {
    status.server = 'unhealthy';
    status.services.database = { status: 'unhealthy', error: error.message };
  }
  
  return status;
};

module.exports = { checkServerHealth };
