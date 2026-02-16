const { buildSupplierFilter } = require('../utils/sql/build-supplier-filter');
const { paginateQueryByOffset } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Fetches a lightweight, paginated list of Suppliers
 * for use in dropdowns and procurement-related workflows.
 *
 * This repository function is optimized for lookup contexts
 * and intentionally avoids unnecessary data expansion.
 *
 * ------------------------------------------------------------------
 * Design Principles
 * ------------------------------------------------------------------
 * - Return minimal identifying fields only
 * - Avoid JOINs unless explicitly enabled by service-layer options
 * - Enforce SQL-level visibility constraints via sanitized filters
 * - Maintain deterministic ordering for stable pagination
 * - Support offset-based pagination
 *
 * ------------------------------------------------------------------
 * Visibility & Security Model
 * ------------------------------------------------------------------
 * - Assumes visibility rules are already resolved by business layer.
 * - Does NOT evaluate permissions.
 * - Trusts sanitized filter flags (e.g., includeArchived).
 * - Client-provided filters must not override ACL.
 *
 * ------------------------------------------------------------------
 * Supported Features
 * ------------------------------------------------------------------
 * - Keyword fuzzy search (when permitted)
 * - Conditional JOIN expansion (status, location)
 * - Offset + limit pagination
 *
 * ------------------------------------------------------------------
 * Returns
 * ------------------------------------------------------------------
 * {
 *   data: Array<{
 *     id: string,
 *     name: string,
 *     contact_name?: string,
 *     code?: string,
 *     status_id: string
 *   }>,
 *   pagination: {
 *     offset: number,
 *     limit: number,
 *     totalRecords: number,
 *     hasMore: boolean
 *   }
 * }
 *
 * @throws {AppError} If database query fails
 */
const getSupplierLookup = async ({
                                   filters = {},
                                   options = {},
                                   limit = 50,
                                   offset = 0,
                                 }) => {
  const context = 'supplier-repository/getSupplierLookup';
  const tableName = 'suppliers s';
  
  const {
    canSearchStatus = false,
    canSearchLocation = false,
  } = options;
  
  const joins = [];
  
  if (canSearchStatus) {
    joins.push('LEFT JOIN status st ON st.id = s.status_id');
  }
  
  if (canSearchLocation) {
    joins.push('LEFT JOIN locations l ON l.id = s.location_id');
  }
  
  const { whereClause, params } = buildSupplierFilter(filters, {
    canSearchStatus,
    canSearchLocation,
  });
  
  const queryText = `
    SELECT
      s.id,
      s.name,
      s.contact_name,
      s.code,
      s.status_id
    FROM ${tableName}
    ${joins.join('\n')}
    WHERE ${whereClause}
  `;
  
  try {
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
      additionalSort: 's.code ASC',
    });
    
    logSystemInfo('Fetched supplier lookup data', {
      context,
      offset,
      limit,
      filters,
      options,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch supplier lookup', {
      context,
      offset,
      limit,
      filters,
      options,
    });
    
    throw AppError.databaseError(
      'Failed to fetch supplier lookup.'
    );
  }
};

module.exports = {
  getSupplierLookup,
};
