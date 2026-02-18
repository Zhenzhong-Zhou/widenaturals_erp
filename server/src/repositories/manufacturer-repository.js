const {
  buildManufacturerFilter,
} = require('../utils/sql/build-manufacturer-filter');
const { paginateQueryByOffset } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Fetches a lightweight, paginated list of Manufacturers
 * for use in dropdowns, autocomplete inputs, and assignment workflows.
 *
 * This repository function is intentionally optimized for lookup scenarios.
 *
 * ------------------------------------------------------------------
 * Design Principles
 * ------------------------------------------------------------------
 * - Return minimal identifying fields only
 * - Avoid JOINs unless explicitly enabled by service-layer options
 * - Enforce SQL-level visibility constraints via sanitized filters
 * - Use deterministic sorting for stable pagination
 * - Support offset-based pagination
 *
 * ------------------------------------------------------------------
 * Visibility & Security Model
 * ------------------------------------------------------------------
 * - Assumes visibility rules have already been resolved by the business layer.
 * - Does NOT evaluate permissions.
 * - Trusts `filters.includeArchived` and `filters.enforceActiveOnly`
 *   to be sanitized and ACL-safe.
 * - Client input must not directly control visibility flags.
 *
 * ------------------------------------------------------------------
 * Supported Features
 * ------------------------------------------------------------------
 * - Keyword-based fuzzy search (when enabled)
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
const getManufacturerLookup = async ({
  filters = {},
  options = {},
  limit = 50,
  offset = 0,
}) => {
  const context = 'manufacturer-repository/getManufacturerLookup';
  const tableName = 'manufacturers m';

  const { canSearchStatus = false, canSearchLocation = false } = options;

  const joins = [];

  if (canSearchStatus) {
    joins.push('LEFT JOIN status s ON s.id = m.status_id');
  }

  if (canSearchLocation) {
    joins.push('LEFT JOIN locations l ON l.id = m.location_id');
  }

  const { whereClause, params } = buildManufacturerFilter(filters, {
    canSearchStatus,
    canSearchLocation,
  });

  const queryText = `
    SELECT
      m.id,
      m.name,
      m.contact_name,
      m.status_id
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
      sortBy: 'm.name',
      sortOrder: 'ASC',
      additionalSort: 'm.code ASC',
    });

    logSystemInfo('Fetched manufacturer lookup data', {
      context,
      offset,
      limit,
      filters,
      options,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch manufacturer lookup', {
      context,
      offset,
      limit,
      filters,
      options,
    });

    throw AppError.databaseError('Failed to fetch manufacturer lookup.');
  }
};

module.exports = {
  getManufacturerLookup,
};
