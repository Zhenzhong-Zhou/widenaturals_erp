const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Fetches all location types from the database.
 *
 * @param {Object} options - Query options.
 * @param {number} [options.page=1] - The page number for pagination.
 * @param {number} [options.limit=10] - The number of records per page.
 * @param {string} [options.sortBy='name'] - Column to sort by.
 * @param {string} [options.sortOrder='ASC'] - Sort order ('ASC' or 'DESC').
 * @returns {Promise<Object>} - A paginated list of location types.
 * @throws {AppError} - Throws an error if the query fails.
 */
const getLocationTypes = async ({ page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC' } = {}) => {
  const tableName = 'location_types lt';
  const joins = [
    'LEFT JOIN status s ON lt.status_id = s.id',
    'LEFT JOIN users u1 ON lt.created_by = u1.id',
    'LEFT JOIN users u2 ON lt.updated_by = u2.id',
  ];
  const whereClause = '1=1';
  
  // Validating sorting inputs
  const validSortColumns = ['name', 'code', 'status_date', 'created_at', 'updated_at'];
  if (!validSortColumns.includes(sortBy)) {
    throw new AppError(`Invalid sort column: ${sortBy}`, 400);
  }
  if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
    throw new AppError(`Invalid sort order: ${sortOrder}`, 400);
  }
  
  // SQL Queries
  const dataQuery = `
    SELECT
      lt.id AS location_type_id,
      lt.name AS location_type_name,
      lt.description AS location_type_description,
      s.id AS status_id,
      s.name AS status_name,
      lt.status_date,
      lt.created_at,
      lt.updated_at,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: dataQuery,
        params: [],
        page,
        limit,
        sortBy: `lt.${sortBy}`,
        sortOrder,
      });
    });
  } catch (error) {
    console.error('Error fetching location types:', error);
    throw new AppError('Failed to fetch location types', 500, error);
  }
};

module.exports = {
  getLocationTypes,
};
