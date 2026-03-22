const { query } = require('../../db');
const AppError = require('../../../utils/AppError');

/**
 * Executes paginated data and count queries safely.
 *
 * Handles:
 * - Pool vs transaction client execution strategy
 * - Parallel vs sequential execution
 * - Count result validation and normalization
 *
 * @param {Object} options
 * @param {string} options.dataQuery
 * @param {any[]} options.dataParams
 * @param {string} options.countQuery
 * @param {any[]} options.countParams
 * @param {import('pg').Pool|import('pg').PoolClient} options.clientOrPool
 *
 * @returns {Promise<{ rows: any[], totalRecords: number }>}
 */
const executePaginatedQueries = async ({
                                         dataQuery,
                                         dataParams,
                                         countQuery,
                                         countParams,
                                         clientOrPool,
                                       }) => {
  //--------------------------------------------------
  // Detect execution mode
  //--------------------------------------------------
  const isClient =
    typeof clientOrPool?.query === 'function' &&
    typeof clientOrPool?.release === 'function';
  
  let dataResult;
  let countResult;
  
  //--------------------------------------------------
  // Execute queries
  //--------------------------------------------------
  if (isClient) {
    // Sequential (transaction-safe)
    dataResult = await query(dataQuery, dataParams, clientOrPool);
    countResult = await query(countQuery, countParams, clientOrPool);
  } else {
    // Parallel (pool-safe)
    [dataResult, countResult] = await Promise.all([
      query(dataQuery, dataParams, clientOrPool),
      query(countQuery, countParams, clientOrPool),
    ]);
  }
  
  //--------------------------------------------------
  // Validate count result
  //--------------------------------------------------
  if (!countResult?.rows?.length) {
    throw AppError.databaseError('Failed to fetch total record count.');
  }
  
  const totalRecords = Number(countResult.rows[0].total) || 0;
  
  return {
    rows: dataResult.rows,
    totalRecords,
  };
};

module.exports = {
  executePaginatedQueries,
};
