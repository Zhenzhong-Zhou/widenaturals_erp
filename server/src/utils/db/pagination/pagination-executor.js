const { query } = require('../../../database/db');
const AppError = require('../../AppError');

/**
 * @typedef {Object} CountRow
 * @property {number|string} [total]
 * @property {number|string} [count]
 * @property {number|string} [total_records]
 */

/**
 * Executes paginated queries (data + count) with optimal strategy.
 *
 * Strategy:
 * - PoolClient (transaction): sequential execution (ensures consistency)
 * - Pool (no transaction): parallel execution (improves performance)
 *
 * Guarantees:
 * - Always returns normalized shape: { rows, totalRecords }
 * - Ensures safe defaults for params
 * - Adds context-aware error handling
 *
 * @param {Object} options
 * @param {string} options.dataQuery - SQL query for fetching paginated data
 * @param {any[]} [options.dataParams=[]] - Parameters for data query
 * @param {string} options.countQuery - SQL query for total count
 * @param {any[]} [options.countParams=[]] - Parameters for count query
 * @param {import('pg').Pool|import('pg').PoolClient} options.clientOrPool
 *
 * @returns {Promise<{ rows: any[], totalRecords: number }>}
 *
 * @throws {AppError} databaseError if queries fail or count is invalid
 */
const executePaginatedQueries = async ({
  dataQuery,
  dataParams = [],
  countQuery,
  countParams = [],
  clientOrPool,
}) => {
  const context = 'pagination-executor/executePaginatedQueries';

  //--------------------------------------------------
  // Validate required inputs
  //--------------------------------------------------
  if (!dataQuery || !countQuery) {
    throw AppError.validationError('Missing required queries', {
      context,
      meta: { dataQuery, countQuery },
    });
  }

  //--------------------------------------------------
  // Detect execution mode (robust)
  //--------------------------------------------------
  const isClient =
    clientOrPool &&
    typeof clientOrPool.query === 'function' &&
    clientOrPool.constructor?.name === 'Client'; // more explicit

  let dataResult;
  let countResult;

  try {
    //--------------------------------------------------
    // Execute queries
    //--------------------------------------------------
    if (isClient) {
      // Transaction-safe: must be sequential
      dataResult = await query(dataQuery, dataParams, clientOrPool);
      countResult = await query(countQuery, countParams, clientOrPool);
    } else {
      // Pool-safe: execute in parallel
      [dataResult, countResult] = await Promise.all([
        query(dataQuery, dataParams, clientOrPool),
        query(countQuery, countParams, clientOrPool),
      ]);
    }
  } catch (err) {
    throw AppError.databaseError('Pagination query execution failed', {
      context,
      meta: {
        error: err.message,
        isClient,
      },
    });
  }

  //--------------------------------------------------
  // Normalize and validate count result
  //--------------------------------------------------
  const countRow = countResult?.rows?.[0];

  if (!countRow) {
    throw AppError.databaseError('Missing count result', { context });
  }

  // Flexible key support
  /** @type {CountRow} */
  const totalRaw = countRow.total ?? countRow.count ?? countRow.total_records;

  const totalRecords = Number(totalRaw);

  if (!Number.isFinite(totalRecords)) {
    throw AppError.databaseError('Invalid total record count', {
      context,
      meta: { totalRaw },
    });
  }

  //--------------------------------------------------
  // Normalize data rows
  //--------------------------------------------------
  const rows = Array.isArray(dataResult?.rows) ? dataResult.rows : [];

  return {
    rows,
    totalRecords,
  };
};

module.exports = {
  executePaginatedQueries,
};
