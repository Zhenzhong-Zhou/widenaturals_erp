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
 * @param {Object} [filters={}] - Optional filters to narrow down warehouse results.
 * @param {string} [filters.statusId] - Optional warehouse status ID to filter by.
 * @param {boolean} [filters.isArchived] - Whether to include archived warehouses.
 * @param {string} [filters.warehouseTypeId] - Optional warehouse type ID to filter by.
 *
 * @returns {{ whereClause: string, params: any[] }} - An object containing the SQL WHERE clause and associated query parameters.
 *
 * @throws {Error} - Throws a generic Error if filter construction fails.
 */
const buildWarehouseFilter = (filters = {}) => {
  try {
    const conditions = ['1=1'];
    const params = [];
    let paramIndex = 1;
    
    if (filters.statusId) {
      conditions.push(`w.status_id = $${paramIndex}`);
      params.push(filters.statusId);
      paramIndex++;
    }
    
    if (filters.isArchived !== undefined) {
      conditions.push(`w.is_archived = $${paramIndex}`);
      params.push(filters.isArchived);
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
    });
    throw AppError.databaseError(
      'Failed to prepare warehouse dropdown filter',
      {
        details: err.message,
        stage: 'build-warehouse-where-clause',
      }
    );
  }
};

module.exports = {
  buildWarehouseFilter,
};
