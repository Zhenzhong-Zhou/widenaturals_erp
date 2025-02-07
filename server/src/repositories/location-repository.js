const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Fetch all locations from the database with pagination & sorting.
 * @param {Object} options - Query parameters
 * @param {number} options.page - Current page number
 * @param {number} options.limit - Number of results per page
 * @param {string} [options.sortBy='name'] - Column to sort by
 * @param {string} [options.sortOrder='ASC'] - Sorting order (ASC/DESC)
 * @returns {Promise<{ locations: Array, pagination: Object }>} Locations data with pagination info
 */
const getLocations = async ({page, limit, sortBy, sortOrder } = {}) => {
  const validSortColumns = ['name', 'created_at', 'updated_at', 'warehouse_fee', 'status_date'];
  
  // Prevent SQL injection by ensuring sort column is valid
  if (!validSortColumns.includes(sortBy)) {
    sortBy = 'name'; // Default to safe column
  }
  
  const tableName = 'locations l';
  const joins = [
    'LEFT JOIN status s ON l.status_id = s.id',
    'LEFT JOIN users u1 ON l.created_by = u1.id',
    'LEFT JOIN users u2 ON l.updated_by = u2.id',
    'LEFT JOIN location_types lt ON l.location_type_id = lt.id',
  ];
  const whereClause = '1=1';
  
  const baseQueryText = `
    SELECT
        l.id AS location_id,
        l.name AS location_name,
        l.address,
        l.status_id,
        s.name AS status_name,
        l.status_date,
        l.created_at,
        l.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by,
        lt.id AS location_type_id,
        lt.name AS location_type_name
    FROM ${tableName}
    ${joins.join(' ')}
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQueryText,
        params: [],
        page,
        limit,
        sortBy: `l.${sortBy}`,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching locations:', error);
    throw new AppError('Failed to fetch locations');
  }
};

module.exports = {
  getLocations,
};
