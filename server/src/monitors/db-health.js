const { query } = require('../database/db');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Check database health by running a lightweight query.
 * @returns {Promise<Object>} - Resolves to an object with health status.
 * @throws {AppError} - If the database is not healthy.
 */
const checkDatabaseHealth = async () => {
  const queryText = 'SELECT 1';
  
  try {
    const startTime = Date.now();
    await query(queryText);
    const duration = Date.now() - startTime;
    
    logSystemInfo('Database health check passed', {
      context: 'health-check',
      query: queryText,
      durationMs: duration,
    });
    
    return {
      status: 'healthy',
      dbConnectionStatus: 'connected',
      query: queryText,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logSystemException(error, 'Database health check failed', {
      context: 'health-check',
      query: queryText,
      severity: 'critical',
    });
    
    throw AppError.healthCheckError('Database is not healthy', 500, {
      type: 'DatabaseHealthError',
      details: error.message,
    });
  }
};

module.exports = { checkDatabaseHealth };
