const { buildPackagingMaterialsFilter } = require('../utils/sql/build-packaging-material-filters');
const { paginateQueryByOffset } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Retrieves a paginated list of packaging materials that are visible for sales orders.
 *
 * This is used in dropdown/autocomplete components in the Sales Order form
 * to let users choose packaging options (e.g., gift boxes, paper bags).
 *
 * Supports keyword search on `name`, `color`, `size`, and `material_composition`.
 *
 * @param {Object} options - Lookup options
 * @param {number} [options.limit=50] - Max number of results
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {Object} [options.filters={}] - Optional filters (e.g., keyword)
 * @returns {Promise<{ items: { label: string, value: string }[], hasMore: boolean }>}
 *
 * @throws {AppError} If query fails
 */
const getPackagingMaterialsForSalesOrderLookup = async ({
                                                          limit = 50,
                                                          offset = 0,
                                                          filters = {},
                                                        }) => {
  const tableName = 'packaging_materials pm';
  
  const { whereClause, params } = buildPackagingMaterialsFilter(filters);
  const queryText = `
    SELECT
      pm.id,
      pm.name,
      pm.size,
      pm.color,
      pm.unit,
      pm.status_id,
      pm.is_archived
    FROM ${tableName}
    WHERE ${whereClause}
  `;
  
  try {
    const result = await paginateQueryByOffset({
      tableName,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'pm.name',
      sortOrder: 'ASC',
      additionalSort: 'pm.name ASC',
    });
    
    logSystemInfo('Fetched packaging materials lookup successfully', {
      context: 'packaging-materials-repository/getPackagingMaterialsForSalesOrderLookup',
      totalFetched: result.data?.length ?? 0,
      offset,
      limit,
      filters,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch packaging materials lookup', {
      context: 'packaging-materials-repository/getPackagingMaterialsForSalesOrderLookup',
      offset,
      limit,
      filters,
    });
    throw AppError.databaseError('Failed to fetch packaging materials.');
  }
};

module.exports = {
  getPackagingMaterialsForSalesOrderLookup,
};
