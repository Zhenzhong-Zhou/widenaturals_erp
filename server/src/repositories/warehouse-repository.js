const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

const getWarehouses = async ({ page, limit, sortBy, sortOrder }) => {
  const validSortColumns = [
    'name',   // Sort by warehouse name
    'location_name',    // Sort by location name
    'storage_capacity', // Sort by storage capacity
    'status_id',        // Sort by warehouse status
    'created_at',       // Sort by record creation time
    'updated_at',       // Sort by record last updated time
  ];
  
  // Default sorting (by name & creation time if invalid sortBy is provided)
  const defaultSortBy = 'w.name, w.created_at';
  sortBy = validSortColumns.includes(sortBy) ? `w.${sortBy}` : defaultSortBy;
  
  const tableName = 'warehouses w';
  
  const joins = [
    'LEFT JOIN locations l ON w.location_id = l.id',
    'LEFT JOIN status s ON w.status_id = s.id',
    'LEFT JOIN users u1 ON w.created_by = u1.id',
    'LEFT JOIN users u2 ON w.updated_by = u2.id',
  ];
  
  const whereClause = '1=1'; // No filters by default
  
  const baseQuery = `
    SELECT
        w.id,
        w.name AS warehouse_name,
        l.name AS location_name,
        w.storage_capacity,
        s.name AS status_name,
        w.created_at,
        w.updated_at,
        COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
        COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params: [],
        page,
        limit,
        sortBy,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching warehouses:', error);
    throw new AppError('Failed to fetch warehouses.');
  }
};

module.exports = {
  getWarehouses,
};
