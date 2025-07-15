const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');
const {
  buildWarehouseFilter,
} = require('../utils/sql/build-warehouse-filters');

/**
 * Fetches a filtered list of warehouses for lookup purposes.
 *
 * Joins relevant tables (locations and warehouse types) to enrich the result set,
 * and supports optional filters such as warehouse type.
 *
 * Filters:
 * - warehouseTypeId (optional): Filter by specific warehouse type ID
 *
 * @param {Object} params
 * @param {Object} params.filters - Optional filtering options used in WHERE clause
 * @returns {Promise<Array>} List of raw warehouse lookup rows, each containing:
 *   - warehouse_id: UUID of the warehouse
 *   - warehouse_name: Name of the warehouse
 *   - location_id: UUID of the associated location
 *   - location_name: Name of the associated location
 *   - warehouse_type_name: Name of the warehouse type (nullable)
 *
 * @throws {AppError} If the query execution fails
 */
const getWarehouseLookup = async ({ filters = {} }) => {
  const { whereClause, params } = buildWarehouseFilter(filters);

  const sql = `
    SELECT
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      w.location_id,
      l.name AS location_name,
      wt.name AS warehouse_type_name
    FROM warehouses w
    JOIN locations l ON w.location_id = l.id
    LEFT JOIN warehouse_types wt ON w.type_id = wt.id
    WHERE ${whereClause}
    ORDER BY w.name ASC;
  `;

  try {
    const result = await query(sql, params);
    return result.rows;
  } catch (error) {
    logSystemException(error, 'Error fetching warehouse lookup options:', {
      context: 'warehouse-repository/getWarehouseLookup',
    });
    throw AppError.databaseError('Failed to fetch warehouse lookup', {
      details: error.message,
      stage: 'query-execution',
    });
  }
};

module.exports = {
  getWarehouseLookup,
};
