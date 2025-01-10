const { query } = require('../database/db');
const { logInfo, logError } = require('../utils/logger-helper');
const AppError = require('../utils/app-error');

/**
 * Check database health by running a lightweight query.
 * @returns {Promise<Object>} - Resolves to an object with health status.
 * @throws {AppError} - If the database is not healthy.
 */
const checkDatabaseHealth = async () => {
  const queryText = 'SELECT 1';
  try {
    const startTime = Date.now();
    await query(queryText); // Lightweight query
    const duration = Date.now() - startTime;
    
    logInfo('Database health check passed', {
      query: queryText,
      duration: `${duration}ms`,
    });
    
    return {
      status: 'healthy',
      dbConnectionStatus: 'connected',
      query: queryText,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logError('Database health check failed', {
      query: queryText,
      error: error.message,
    });
    
    throw new AppError('Database is not healthy', 500, {
      type: 'DatabaseHealthError',
      details: error.message,
    });
  }
};

module.exports = { checkDatabaseHealth };
