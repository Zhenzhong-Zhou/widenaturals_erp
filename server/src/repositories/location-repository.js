const { buildLocationFilter } = require('../utils/sql/build-location-filters');
const { paginateQuery } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Retrieves paginated Location summary records.
 *
 * This repository function composes:
 * - Dynamic filter conditions via `buildLocationFilter`
 * - Safe, parameterized SQL with LEFT JOINs
 * - Centralized pagination via `paginateQuery`
 * - Structured logging for observability and debugging
 *
 * ─────────────────────────────────────────────────────────────
 * Query Scope
 * ─────────────────────────────────────────────────────────────
 * Returns summary-level data suitable for:
 * - UI table list views
 * - Expandable rows (light metadata only)
 * - Administrative dashboards
 *
 * Includes:
 * - Location basic fields (name, city, country, archived flag)
 * - Location type name
 * - Status name
 * - Audit metadata (created/updated timestamps and user names)
 *
 * NOTE:
 * This function is optimized for list views.
 * Heavy detail fields should be fetched via `getLocationById`.
 *
 * ─────────────────────────────────────────────────────────────
 * Filtering
 * ─────────────────────────────────────────────────────────────
 * Filtering is delegated to `buildLocationFilter`, which ensures:
 * - Safe parameterized queries
 * - Consistent WHERE clause generation
 * - Date range normalization
 *
 * ─────────────────────────────────────────────────────────────
 * Pagination & Sorting
 * ─────────────────────────────────────────────────────────────
 * - Page and limit are validated upstream
 * - Sorting is dynamic but must map to safe column names
 * - Total record count is calculated via COUNT query
 *
 * ─────────────────────────────────────────────────────────────
 * Observability
 * ─────────────────────────────────────────────────────────────
 * - Successful executions log pagination metrics
 * - Failures log structured exception details
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Structured filter criteria
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Page size
 * @param {string} [options.sortBy='created_at'] - Sort column
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction
 *
 * @returns {Promise<{
 *   data: Array,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>}
 *
 * @throws {AppError.databaseError} If query execution fails
 */
const getPaginatedLocations = async ({
                                       filters = {},
                                       page = 1,
                                       limit = 10,
                                       sortBy = 'created_at',
                                       sortOrder = 'DESC',
                                     }) => {
  const context = 'location-repository/getPaginatedLocations';
  
  try {
    const tableName = 'locations l';
    
    const joins =  [
      'LEFT JOIN status s ON l.status_id = s.id',
      'LEFT JOIN location_types lt ON l.location_type_id = lt.id',
      'LEFT JOIN users u1 ON l.created_by = u1.id',
      'LEFT JOIN users u2 ON l.updated_by = u2.id',
    ]
    
    // -------------------------------------------------------------
    // Build WHERE clause
    // -------------------------------------------------------------
    const { whereClause, params } = buildLocationFilter(filters);
    
    // -------------------------------------------------------------
    // Base SELECT query (NO ORDER BY here)
    // -------------------------------------------------------------
    const baseQueryText = `
      SELECT
        l.id,
        l.name,
        lt.name AS location_type_name,
        l.city,
        l.province_or_state,
        l.country,
        l.is_archived,
        l.status_id,
        s.name AS status_name,
        l.status_date,
        l.created_at,
        l.updated_at,
        l.created_by,
        l.updated_by,
        u1.firstname AS created_by_firstname,
        u1.lastname AS created_by_lastname,
        u2.firstname AS updated_by_firstname,
        u2.lastname AS updated_by_lastname
        FROM ${tableName}
        ${joins.join('\n')}
        WHERE ${whereClause}
    `;
    
    // -------------------------------------------------------------
    // Paginated execution
    // -------------------------------------------------------------
    const result =  await paginateQuery({
      tableName: 'locations l',
      joins,
      whereClause,
      queryText: baseQueryText,
      params,
      page,
      limit,
      sortBy,
      sortOrder,
      meta: {
        context,
        filters,
        page,
        limit,
        sortBy,
        sortOrder,
      },
    });
    
    logSystemInfo('Paginated locations query executed', {
      context,
      filters,
      pagination: {
        page,
        limit,
        returned: result.data.length,
        total: result.pagination.totalRecords,
      },
      sorting: {
        sortBy,
        sortOrder,
      },
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated locations', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch locations', {
      context,
      details: error.message,
    });
  }
};

module.exports = {
  getPaginatedLocations,
};
