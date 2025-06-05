const { query, paginateQuery, retry, bulkInsert } = require('../database/db');
const AppError = require('../utils/AppError');
const { buildLotAdjustmentWhereClause } = require('../utils/sql/lot-adjustment-type-filters');
const { logSystemException } = require('../utils/system-logger');

/**
 * @function getLotAdjustmentTypesForDropdown
 * @description
 * Fetches active lot adjustment types linked to inventory action types of category 'adjustment'.
 * Excludes internal/system-use-only types (e.g., 'manual_stock_insert', 'manual_stock_update') by default,
 * unless overridden via filters.
 *
 * @param {Object} [filters={}] - Optional filters to modify query behavior.
 * @param {boolean} [filters.excludeInternal=true] - Whether to exclude internal-only types.
 * @returns {Promise<Array>} List of lot adjustment types with their corresponding action types.
 *
 * @example
 * // Default usage (excludes internal)
 * const options = await getLotAdjustmentTypesForDropdown();
 *
 * @example
 * // Admin usage (include all types)
 * const options = await getLotAdjustmentTypesForDropdown({ excludeInternal: false });
 */
const getLotAdjustmentTypesForDropdown = async (filters = {}) => {
  const { whereClause, params } = buildLotAdjustmentWhereClause(filters);
    
    const sql = `
      SELECT
        lat.id AS lot_adjustment_type_id,
        iat.id AS inventory_action_type_id,
        lat.name
      FROM lot_adjustment_types lat
      JOIN inventory_action_types iat ON lat.inventory_action_type_id = iat.id
      WHERE ${whereClause}
      ORDER BY lat.name ASC;
    `;
    try {
     const result = await query(sql, params);
     return result.rows;
   } catch (error) {
      logSystemException(error, 'Failed to fetch lot adjustment types for dropdown', {
        context: 'lot-adjustment-type-repository/getLotAdjustmentTypesForDropdown',
        filters,
        params,
      });
      
      throw AppError.databaseError('Unable to load lot adjustment dropdown options', {
        stage: 'getLotAdjustmentTypesForDropdown',
      });
    }
};

module.exports = {
  getLotAdjustmentTypesForDropdown,
};
