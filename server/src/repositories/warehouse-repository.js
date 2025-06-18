const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { logSystemException } = require('../utils/system-logger');
const {
  buildWarehouseFilter,
} = require('../utils/sql/build-warehouse-filters');
const { getStatusId } = require('../config/status-cache');

/**
 * Fetches a list of warehouses for lookup use.
 *
 * Filters:
 * - locationTypeId (optional): Filter warehouses by location type
 * - warehouseTypeId (optional): Filter by warehouse type
 * - includeArchived (optional): Include archived warehouses (default: false)
 *
 * @param {Object} filters - Filtering options
 * @returns {Promise<Array>} List of warehouse lookup rows
 */
const getWarehouseLookup = async ({ filters }) => {
  const defaultActiveStatusId = getStatusId('warehouse_active');
  const { whereClause, params } = buildWarehouseFilter(
    defaultActiveStatusId,
    filters
  );

  const sql = `
    SELECT
      w.id AS warehouse_id,
      w.name AS warehouse_name,
      w.location_id,
      l.name AS location_name,
      l.location_type_id,
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
