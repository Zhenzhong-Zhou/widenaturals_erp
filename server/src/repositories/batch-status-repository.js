const { buildBatchStatusFilter } = require('../utils/sql/build-batch-status-filter');
const { paginateQueryByOffset } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Retrieve paginated batch status lookup records from the database.
 *
 * This repository function executes a read-only query used by lookup
 * endpoints and dropdown components that display batch lifecycle
 * status values.
 *
 * Responsibilities:
 * - Build SQL filtering conditions using `buildBatchStatusFilter`
 * - Execute the query through the shared `paginateQueryByOffset` utility
 * - Return a standardized `{ data, pagination }` result
 *
 * This function does not enforce access control or business rules.
 * Those responsibilities belong to the service layer.
 *
 * @async
 *
 * @param {Object} params
 *
 * @param {Object} [params.filters={}]
 * Optional SQL filter inputs (keyword, active flags, etc.).
 *
 * @param {number} [params.limit=50]
 * Maximum number of rows returned.
 *
 * @param {number} [params.offset=0]
 * Pagination offset.
 *
 * @returns {Promise<Object>}
 * Paginated query result:
 *
 * {
 *   data: Array<Object>,
 *   pagination: {
 *     limit: number,
 *     offset: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }
 *
 * @throws {AppError.databaseError}
 * If the database query fails.
 */
const getBatchStatusLookup = async ({
                                      filters = {},
                                      limit = 50,
                                      offset = 0,
                                    }) => {
  const context = 'batch-status-repository/getBatchStatusLookup';
  const tableName = 'batch_status bs';
  
  //------------------------------------------------------------
  // Build dynamic WHERE clause based on provided filters
  //------------------------------------------------------------
  const { whereClause, params } = buildBatchStatusFilter(filters);
  
  //------------------------------------------------------------
  // Base SQL query used by pagination utility
  //------------------------------------------------------------
  const queryText = `
    SELECT
      bs.id,
      bs.name,
      bs.description,
      bs.is_active
    FROM ${tableName}
    WHERE ${whereClause}
  `;
  
  try {
    //------------------------------------------------------------
    // Execute paginated query using shared DB helper
    //------------------------------------------------------------
    const result = await paginateQueryByOffset({
      tableName,
      joins: [],
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'bs.name',
      sortOrder: 'ASC',
    });
    
    logSystemInfo('Fetched batch status lookup data', {
      context,
      offset,
      limit,
      filters,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch batch status lookup', {
      context,
      offset,
      limit,
      filters,
    });
    
    throw AppError.databaseError(
      'Failed to fetch batch status lookup.'
    );
  }
};

module.exports = {
  getBatchStatusLookup,
};
