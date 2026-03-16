const { buildPackagingMaterialSupplierFilter } = require('../utils/sql/build-packaging-material-supplier-filter');
const { paginateQueryByOffset } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Retrieves packaging material supplier lookup data with pagination.
 *
 * Used by dropdown components to select suppliers when creating
 * or managing packaging material sourcing relationships.
 *
 * Archived suppliers are excluded by default unless explicitly
 * requested through filter options.
 *
 * @param {Object} params
 * @param {Object} params.filters
 * @param {number} params.limit
 * @param {number} params.offset
 *
 * @returns {Promise<{
 *   data: Array<{
 *     id: string,
 *     supplier_id: string,
 *     name: string,
 *     contact_name: string|null,
 *     contact_email: string|null,
 *     is_preferred: boolean,
 *     is_archived: boolean,
 *     status_id: string
 *   }>,
 *   pagination: {
 *     offset: number,
 *     limit: number,
 *     totalRecords: number,
 *     hasMore: boolean
 *   }
 * }>}
 */
const getPackagingMaterialSupplierLookup = async ({
                                                    filters = {},
                                                    limit = 50,
                                                    offset = 0,
                                                  }) => {
  const context =
    'packaging-material-supplier-repository/getPackagingMaterialSupplierLookup';
  
  const tableName = 'packaging_material_suppliers pms';
  
  const joins = [
    'JOIN suppliers s ON s.id = pms.supplier_id',
    'LEFT JOIN status st ON st.id = s.status_id'
  ];
  
  //------------------------------------------------------------
  // Build dynamic WHERE clause
  //------------------------------------------------------------
  const { whereClause, params } =
    buildPackagingMaterialSupplierFilter(filters);
  
  //------------------------------------------------------------
  // Base query
  //------------------------------------------------------------
  const queryText = `
    SELECT
      pms.id,
      pms.is_preferred,
      s.name,
      s.contact_name,
      s.contact_email,
      s.is_archived,
      s.status_id
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;
  
  try {
    //------------------------------------------------------------
    // Execute paginated query
    //------------------------------------------------------------
    const result = await paginateQueryByOffset({
      tableName,
      joins,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 's.name',
      sortOrder: 'ASC',
    });
    
    logSystemInfo('Fetched packaging material supplier lookup', {
      context,
      filters,
      limit,
      offset,
    });
    
    return result;
  } catch (error) {
    logSystemException(
      error,
      'Failed to fetch packaging material supplier lookup',
      {
        context,
        filters,
        limit,
        offset,
      }
    );
    
    throw AppError.databaseError(
      'Failed to fetch packaging material supplier lookup.'
    );
  }
};

module.exports = {
  getPackagingMaterialSupplierLookup,
};
