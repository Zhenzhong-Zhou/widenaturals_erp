/**
 * @file db-health.js
 * @description Database and pool health checks.
 *
 * Responsibilities:
 * - Verify database connectivity
 * - Provide lightweight pool status validation
 *
 * Design Principles:
 * - Health checks must be fast and side-effect free
 * - Throw on failure (health contract)
 * - Avoid noisy logging (handled by health runner)
 */

const { query, pool } = require('../../database/db');
const AppError = require('../../utils/AppError');

const CONTEXT = 'health/database';

/**
 * Checks database connectivity using a lightweight query.
 *
 * @returns {Promise<Object>} Health metadata
 * @throws {AppError} When database is unreachable
 */
const checkDatabaseHealth = async () => {
  const queryText = 'SELECT 1';
  
  const start = Date.now();
  
  try {
    await query(queryText);
    
    const duration = Date.now() - start;
    
    return {
      status: 'healthy',
      latencyMs: duration,
    };
  } catch (error) {
    throw AppError.healthCheckError('Database is not healthy', {
      context: CONTEXT,
      type: 'DatabaseHealthError',
      details: error.message,
    });
  }
};

/**
 * Checks connection pool health.
 *
 * NOTE:
 * - Uses pg.Pool internal counters
 * - Does NOT perform queries
 *
 * @returns {Object} Pool health snapshot
 * @throws {AppError} When pool is unusable
 */
const checkPoolHealth = () => {
  //--------------------------------------------------
  // Validate pool existence
  //--------------------------------------------------
  if (!pool) {
    throw AppError.healthCheckError('Pool not initialized', {
      context: CONTEXT,
      subtype: 'PoolHealthError',
    });
  }
  
  //--------------------------------------------------
  // Collect metrics (pg built-in)
  //--------------------------------------------------
  const total = pool.totalCount;
  const idle = pool.idleCount;
  const waiting = pool.waitingCount;
  
  //--------------------------------------------------
  // Return snapshot (no logging)
  //--------------------------------------------------
  return {
    status: 'healthy',
    total,
    idle,
    waiting,
    utilization: total > 0 ? (total - idle) / total : 0,
  };
};

module.exports = {
  checkDatabaseHealth,
  checkPoolHealth,
};
