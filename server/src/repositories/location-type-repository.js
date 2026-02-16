const { buildLocationTypeFilter } = require('../utils/sql/build-location-type-filter');
const {
  query,
  paginateQuery,
  paginateQueryByOffset
} = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Retrieves paginated Location Type summary records.
 *
 * ─────────────────────────────────────────────────────────────
 * Purpose
 * ─────────────────────────────────────────────────────────────
 * Provides a normalized, audit-aware list view of location types.
 * This function is intended for configuration-level entities where:
 *
 * - Administrators manage available location classifications
 * - Settings modules require structured type definitions
 * - UI tables display metadata with status and audit information
 *
 * ─────────────────────────────────────────────────────────────
 * Data Characteristics
 * ─────────────────────────────────────────────────────────────
 * Returns summary-level fields only (no relational aggregates).
 *
 * Included:
 * - Core identity fields (id, code, name, description)
 * - Status metadata (status_id, status_name, status_date)
 * - Audit metadata (created_at, updated_at, created_by, updated_by)
 * - Human-readable audit user names
 *
 * Excluded:
 * - No heavy joins
 * - No dependent entity counts
 * - No computed business logic fields
 *
 * NOTE:
 * This function is optimized for list/table rendering.
 * For single-record detail retrieval, use `getLocationTypeById`.
 *
 * ─────────────────────────────────────────────────────────────
 * Filtering
 * ─────────────────────────────────────────────────────────────
 * Filtering is delegated to `buildLocationTypeFilter`, which:
 * - Generates safe, parameterized WHERE clauses
 * - Supports keyword-based search (code/name)
 * - Allows status-based filtering
 * - Ensures consistent filter logic across modules
 *
 * ─────────────────────────────────────────────────────────────
 * Pagination & Sorting
 * ─────────────────────────────────────────────────────────────
 * - Page is 1-based indexing
 * - Limit controls page size
 * - Sorting must map to validated database columns
 * - Total record count is calculated separately via COUNT query
 *
 * ─────────────────────────────────────────────────────────────
 * Observability
 * ─────────────────────────────────────────────────────────────
 * - Successful executions log pagination metrics
 * - Failures log structured exception details with context
 *
 * ─────────────────────────────────────────────────────────────
 * Architectural Notes
 * ─────────────────────────────────────────────────────────────
 * - Designed for consistency with other repository list functions
 * - Keeps ORDER BY outside base query (handled by paginateQuery)
 * - Maintains strict separation of filtering, pagination, and logging
 *
 * @param {Object} options
 * @param {Object} [options.filters={}] - Structured filter criteria
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Page size
 * @param {string} [options.sortBy='created_at'] - Sort column (validated)
 * @param {'ASC'|'DESC'} [options.sortOrder='DESC'] - Sort direction
 *
 * @returns {Promise<{
 *   data: Array<Object>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>}
 *
 * @throws {AppError.databaseError}
 *   If query execution fails or database interaction errors occur.
 */
const getPaginatedLocationTypes = async ({
                                           filters = {},
                                           page = 1,
                                           limit = 10,
                                           sortBy = 'created_at',
                                           sortOrder = 'DESC',
                                         }) => {
  const context = 'location-type-repository/getPaginatedLocationTypes';
  
  try {
    const tableName = 'location_types lt';
    
    const joins = [
      'LEFT JOIN status s ON lt.status_id = s.id',
      'LEFT JOIN users u1 ON lt.created_by = u1.id',
      'LEFT JOIN users u2 ON lt.updated_by = u2.id',
    ];
    
    // -------------------------------------------------------------
    // WHERE clause
    // -------------------------------------------------------------
    const { whereClause, params } = buildLocationTypeFilter(filters);
    
    // -------------------------------------------------------------
    // Base SELECT (NO ORDER BY)
    // -------------------------------------------------------------
    const baseQueryText = `
      SELECT
        lt.id,
        lt.code,
        lt.name,
        lt.description,
        lt.status_id,
        s.name AS status_name,
        lt.status_date,
        lt.created_at,
        lt.updated_at,
        lt.created_by,
        lt.updated_by,
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
    const result = await paginateQuery({
      tableName,
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
    
    logSystemInfo('Paginated location types query executed', {
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
    logSystemException(error, 'Failed to fetch paginated location types', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch location types', {
      context,
      details: error.message,
    });
  }
};

/**
 * Retrieves a single Location Type record by ID.
 *
 * ─────────────────────────────────────────────────────────────
 * Query Scope
 * ─────────────────────────────────────────────────────────────
 * Returns full detail for a single configuration entity.
 *
 * Includes:
 * - Core identity (id, code, name, description)
 * - Status metadata
 * - Audit metadata with user names
 *
 * NOTE:
 * This function does not throw if record is not found.
 * It returns `null`, allowing service layer to decide
 * whether to return 404 or handle differently.
 *
 * @param {string} id - Location Type UUID
 * @returns {Promise<Record<string, any> | null>}
 *
 * @throws {AppError.databaseError}
 */
const getLocationTypeById = async (id) => {
  const context = 'location-type-repository/getLocationTypeById';
  
  try {
    const queryText = `
      SELECT
        lt.id,
        lt.code,
        lt.name,
        lt.description,
        lt.status_id,
        s.name AS status_name,
        lt.status_date,
        lt.created_at,
        lt.updated_at,
        lt.created_by,
        lt.updated_by,
        u1.firstname AS created_by_firstname,
        u1.lastname AS created_by_lastname,
        u2.firstname AS updated_by_firstname,
        u2.lastname AS updated_by_lastname
      FROM location_types lt
      LEFT JOIN status s ON lt.status_id = s.id
      LEFT JOIN users u1 ON lt.created_by = u1.id
      LEFT JOIN users u2 ON lt.updated_by = u2.id
      WHERE lt.id = $1
      LIMIT 1
    `;
    
    const { rows } = await query(queryText, [id]);
    
    if (!rows.length) {
      logSystemInfo('Location type not found', {
        context,
        id,
      });
      
      return null;
    }
    
    logSystemInfo('Location type fetched successfully', {
      context,
      id,
    });
    
    return rows[0];
  } catch (error) {
    logSystemException(error, 'Failed to fetch location type by id', {
      context,
      id,
    });
    
    throw AppError.databaseError('Failed to fetch location type', {
      context,
      details: error.message,
    });
  }
};

/**
 * Fetches a lightweight, paginated list of Location Types
 * for use in dropdowns and configuration workflows.
 *
 * This repository function is optimized for lookup scenarios.
 *
 * ------------------------------------------------------------------
 * Design Principles
 * ------------------------------------------------------------------
 * - Return minimal identifying fields only
 * - Avoid unnecessary JOINs
 * - Enforce SQL-level visibility constraints via sanitized filters
 * - Use deterministic sorting for stable pagination
 * - Support offset-based pagination
 *
 * ------------------------------------------------------------------
 * Visibility & Security Model
 * ------------------------------------------------------------------
 * - Assumes visibility rules have already been resolved
 *   by the business layer.
 * - Does NOT evaluate permissions.
 * - Trusts `filters.enforceActiveOnly` and `filters.statusIds`
 *   to be ACL-safe and sanitized.
 * - Client input must not directly control visibility flags.
 *
 * ------------------------------------------------------------------
 * Supported Features
 * ------------------------------------------------------------------
 * - Keyword-based fuzzy search (code, name)
 * - ACTIVE-only enforcement
 * - Explicit status filtering
 * - Offset + limit pagination
 *
 * ------------------------------------------------------------------
 * Returns
 * ------------------------------------------------------------------
 * {
 *   data: Array<{
 *     id: string,
 *     code: string,
 *     name: string,
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
const getLocationTypeLookup = async ({
                                       filters = {},
                                       options = {},
                                       limit = 50,
                                       offset = 0,
                                     }) => {
  const context = 'location-type-repository/getLocationTypeLookup';
  const tableName = 'location_types lt';
  
  const {
    canSearchStatus = false,
  } = options;
  
  const joins = [];
  
  if (canSearchStatus) {
    joins.push('LEFT JOIN status s ON s.id = lt.status_id');
  }
  
  const { whereClause, params } = buildLocationTypeFilter(filters, { canSearchStatus });
  
  const queryText = `
    SELECT
      lt.id,
      lt.name,
      lt.status_id
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
      sortBy: 'lt.name',
      sortOrder: 'ASC',
      additionalSort: 'lt.code ASC',
    });
    
    logSystemInfo('Fetched location type lookup data', {
      context,
      offset,
      limit,
      filters,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch location type lookup', {
      context,
      offset,
      limit,
      filters,
    });
    
    throw AppError.databaseError(
      'Failed to fetch location type lookup.'
    );
  }
};

module.exports = {
  getPaginatedLocationTypes,
  getLocationTypeById,
  getLocationTypeLookup,
};
