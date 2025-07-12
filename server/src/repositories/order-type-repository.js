const { buildOrderTypeFilter } = require('../utils/sql/build-order-type-filters');
const { paginateQuery } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Fetches paginated and optionally filtered list of order types from the database.
 *
 * Executes a raw SQL query with dynamic WHERE clause, sorting, and pagination support.
 * Join `status`, `users` (created_by / updated_by) for enriched display data.
 *
 * @param {Object} options - Query options.
 * @param {number} [options.page=1] - Page number (1-based).
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy='name'] - Column to sort by (e.g., 'name', 'created_at').
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC'] - Sorting direction.
 * @param {Object} [options.filters={}] - Filtering criteria (category, keyword, status, etc.).
 *
 * @returns {Promise<{ data: Array, pagination: Object }>} A promise resolving to paginated order types with metadata.
 *
 * @throws {AppError} Throws if the query fails or pagination fails.
 *
 * @example
 * const result = await getPaginatedOrderTypes({
 *   page: 2,
 *   limit: 20,
 *   sortBy: 'created_at',
 *   sortOrder: 'DESC',
 *   filters: {
 *     category: 'sales',
 *     keyword: 'return',
 *     requiresPayment: true,
 *   }
 * });
 */
const getPaginatedOrderTypes = async ({
                                  filters = {},
                                  page = 1,
                                  limit = 10,
                                  sortBy = 'name',
                                  sortOrder = 'ASC',
                                }) => {
  const { whereClause, params } = buildOrderTypeFilter(filters);
  
  const tableName = 'order_types ot';
  
  const joins = [
    'INNER JOIN status s ON ot.status_id = s.id',
    'LEFT JOIN users u1 ON ot.created_by = u1.id',
    'LEFT JOIN users u2 ON ot.updated_by = u2.id',
  ];
  
  const baseQuery = `
    SELECT
      ot.id,
      ot.name,
      ot.code,
      ot.category,
      ot.requires_payment,
      ot.description,
      ot.status_id,
      s.name AS status_name,
      ot.status_date,
      ot.created_at,
      ot.updated_at,
      u1.firstname AS created_by_firstname,
      u1.lastname AS created_by_lastname,
      u2.firstname AS updated_by_firstname,
      u2.lastname AS updated_by_lastname
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;

  try {
    const result = await paginateQuery({
      tableName,
      joins,
      whereClause,
      queryText: baseQuery,
      params,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    logSystemInfo('Fetched order types successfully', {
      context: 'order-type-repository/getPaginatedOrderTypes',
      resultCount: result?.data?.length,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated order types from database', {
      context: 'order-type-repository/getPaginatedOrderTypes',
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Unable to retrieve order types. Please try again later.');
  }
};

module.exports = {
  getPaginatedOrderTypes,
};
