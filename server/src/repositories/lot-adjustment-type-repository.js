const { query } = require('../database/db');
const AppError = require('../utils/AppError');
const { buildLotAdjustmentWhereClause } = require('../utils/sql/build-lot-adjustment-type-filters');
const { logSystemException } = require('../utils/system-logger');

/**
 * Retrieves active lot adjustment types linked to inventory action types categorized as 'adjustment'.
 *
 * By default, internal/system-only types such as `'manual_stock_insert'` and `'manual_stock_update'`
 * are excluded unless explicitly included via the `filters` parameter.
 *
 * @param {Object} [filters={}] - Optional configuration to control query behavior.
 * @param {boolean} [filters.excludeInternal=true] - If true, excludes internal adjustment types.
 * @returns {Promise<Array>} A promise that resolves to a list of lot adjustment types and their related action types.
 *
 * @example
 * // Default (excludes internal types)
 * const types = await getLotAdjustmentTypeLookup();
 *
 * @example
 * // Include internal/system adjustment types
 * const types = await getLotAdjustmentTypeLookup({ excludeInternal: false });
 */
const getLotAdjustmentTypeLookup = async (filters = {}) => {
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
      logSystemException(error, 'Failed to fetch lot adjustment types for lookup', {
        context: 'lot-adjustment-type-repository/getLotAdjustmentTypeLookup',
        filters,
        params,
      });
      
      throw AppError.databaseError('Unable to load lot adjustment lookup options', {
        stage: 'lot-adjustment-type-repository/getLotAdjustmentTypeLookup',
      });
    }
};

module.exports = {
  getLotAdjustmentTypeLookup,
};
