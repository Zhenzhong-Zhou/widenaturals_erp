/**
 * @fileoverview
 * Utility to build dynamic SQL WHERE clause and parameter array
 * for warehouse dropdown filters.
 *
 * This supports filtering by status, location type, warehouse type,
 * and archived status. It is used primarily in the warehouse repository layer
 * to construct secure and flexible SQL queries for dropdown usage.
 */

const { logSystemException } = require('../system-logger');
const AppError = require('../AppError');

/**
 * Dynamically builds an SQL WHERE clause and parameter list for filtering warehouses.
 *
 * @param {string} [statusId] - Optional warehouse status ID. Defaults to active status unless overridden.
 * @param {Object} [filters={}] - Optional filters for location and warehouse attributes.
 * @param {boolean} [filters.isArchived] - Optional flag to filter archived warehouses. Only effective if includeArchived is true.
 * @param {string} [filters.locationTypeId] - Optional location type ID to filter by.
 * @param {string} [filters.warehouseTypeId] - Optional warehouse type ID to filter by.
 * @param {Object} [options={}] - Optional flags to control behavior.
 * @param {boolean} [options.overrideDefaultStatus=false] - If true, skips filtering by statusId.
 * @param {boolean} [options.includeArchived=false] - If true, allows archived filters to be included.
 *
 * @returns {{ whereClause: string, params: any[] }} - SQL WHERE clause and parameter values.
 *
 * @throws {AppError} - Throws databaseError if-clause construction fails.
 */
const buildWarehouseFilter = (
  statusId ,
  filters = {},
  {
    overrideDefaultStatus = false,
    includeArchived = false,
  } = {}
) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    if (!overrideDefaultStatus && statusId) {
      conditions.push(`w.status_id = $${paramIndex}`);
      params.push(statusId);
      paramIndex++;
    }
    
    if (!includeArchived) {
      conditions.push(`w.is_archived = false`);
    } else if (filters.isArchived !== undefined) {
      conditions.push(`w.is_archived = $${paramIndex}`);
      params.push(filters.isArchived);
      paramIndex++;
    }
    
    if (filters.locationTypeId) {
      conditions.push(`l.location_type_id = $${paramIndex}`);
      params.push(filters.locationTypeId);
      paramIndex++;
    }
    
    if (filters.warehouseTypeId) {
      conditions.push(`w.type_id = $${paramIndex}`);
      params.push(filters.warehouseTypeId);
      paramIndex++;
    }
    
    return {
      whereClause: conditions.join(' AND '),
      params,
    };
  } catch (err) {
    logSystemException(err, 'Failed to build warehouse dropdown filter', {
      context: 'warehouse-repository/buildWarehouseDropdownFilter',
      error: err.message,
      filters,
      statusId,
    });
    throw AppError.databaseError('Failed to prepare warehouse dropdown filter', {
      details: err.message,
      stage: 'build-warehouse-where-clause',
    });
  }
};

module.exports = {
  buildWarehouseFilter
};
