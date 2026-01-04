const AppError = require('../utils/AppError');
const {
  query,
  paginateResults,
  paginateQueryByOffset,
} = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const {
  buildStatusLookupFilters,
} = require('../utils/sql/build-status-filters');

/**
 * Resolves a status ID by name.
 *
 * Bootstrap / infrastructure only.
 * - No ACL
 * - No business semantics
 * - No status-state interpretation
 *
 * Intended usage:
 * - Root admin initialization
 * - Seed scripts
 * - Migration / bootstrap utilities
 *
 * @param {string} statusName - Human-readable status name (e.g. "active")
 * @param {object} [client] - Optional transaction client
 * @returns {Promise<string>} statusId
 *
 * @throws {AppError}
 * - validationError if name missing
 * - databaseError if status does not exist or query fails
 */
const resolveStatusIdByName = async (statusName, client) => {
  const context = 'status-repository/resolveStatusIdByName';
  
  if (!statusName) {
    throw AppError.validationError('Status name is required.', { context });
  }
  
  const sql = `
    SELECT id
    FROM status
    WHERE name = LOWER($1)
    LIMIT 1
  `;
  
  try {
    const { rows } = await query(sql, [statusName], client);
    
    if (!rows.length) {
      throw AppError.databaseError(
        `Required status "${statusName}" not found.`,
        { context }
      );
    }
    
    return rows[0].id;
  } catch (error) {
    logSystemException(error, 'Failed to resolve status ID by name', {
      context,
      statusName,
    });
    
    throw error instanceof AppError
      ? error
      : AppError.databaseError('Failed to resolve status ID.', {
        context,
        cause: error,
      });
  }
};

/**
 * Repository: Get Paginated Statuses
 *
 * Retrieves statuses with pagination, dynamic filtering, safe sorting,
 * and structured system logging. Designed to support both admin UI tables
 * and restricted ACL-driven lookup lists.
 *
 * Filters are validated and normalized by the business layer, then converted
 * into SQL WHERE clauses by `buildStatusLookupFilters`.
 *
 * @async
 * @function
 * @param {Object} options
 * @param {Object} [options.filters={}] - Structured filter criteria (is_active, name, keyword, etc.)
 * @param {number} [options.page=1] - Current page (1-based)
 * @param {number} [options.limit=10] - Items per page
 * @param {string} [options.sortBy='name'] - Sort column (validated by SORTABLE_FIELDS)
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC'] - Sort direction
 *
 * @returns {Promise<{
 *   data: any[];
 *   pagination: {
 *     page: number;
 *     limit: number;
 *     totalRecords: number;
 *     totalPages: number;
 *   }
 * }>}
 *
 * @throws {AppError} - On query or pagination failure
 */
const getPaginatedStatuses = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'ASC',
}) => {
  const context = 'status-repository/getPaginatedStatuses';

  // Build WHERE + params
  const { whereClause, params } = buildStatusLookupFilters(filters);

  // Construct parameterized base query
  const queryText = `
    SELECT
      s.id,
      s.name,
      s.description,
      s.is_active,
      s.created_at,
      s.updated_at
    FROM status AS s
    WHERE ${whereClause}
    ORDER BY ${sortBy} ${sortOrder};
  `;

  try {
    // Execute paginated query
    const result = await paginateResults({
      dataQuery: queryText,
      params,
      page,
      limit,
      meta: { context },
    });

    // Empty result case (consistent with product repo)
    if (!result?.data?.length) {
      logSystemInfo('No statuses found for current query', {
        context,
        filters,
        pagination: { page, limit },
        sorting: { sortBy, sortOrder },
      });

      return {
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }

    // Successful fetch
    logSystemInfo('Fetched paginated status records successfully', {
      context,
      filters,
      pagination: result.pagination,
      sorting: { sortBy, sortOrder },
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated statuses', {
      context,
      filters,
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });

    throw AppError.databaseError('Failed to fetch paginated statuses.', {
      context,
      details: error.message,
    });
  }
};

/**
 * Fetches the details of a status by its ID.
 *
 * @param {uuid} id - The ID of the status to fetch.
 * @returns {Promise<Object|null>} - The status object if found, otherwise null.
 * @throws {AppError} - Throws an error if the query fails or if the ID is not provided.
 */
const getStatusById = async (id) => {
  if (!id) {
    throw AppError.validationError('Status ID is required');
  }

  const text = `
    SELECT id, name, description, is_active, created_at
    FROM status
    WHERE id = $1;
  `;

  try {
    const result = await query(text, [id]);
    return result.rows[0] || null;
  } catch (error) {
    throw AppError.databaseError(
      'Failed to fetch the status from the database'
    );
  }
};

/**
 * Repository Utility: Check if a status record exists.
 *
 * Performs a fast, parameterized existence check using `SELECT EXISTS`
 * against the `status` table.
 *
 * ### Characteristics
 * - Uses index-only lookup when available (UUID primary key).
 * - Returns a boolean result (`true` if status exists, otherwise `false`).
 * - Accepts an optional PostgreSQL client for transactional safety.
 * - Throws a structured `AppError.databaseError` on query failure.
 *
 * ### Performance
 * This query is O(1) for practical purposes:
 * - It short-circuits on the first match.
 * - Reads only index metadata and minimal tuple data.
 *
 * ### Parameters
 * @param {string} statusId - The UUID of the status to verify.
 * @param {import('pg').PoolClient} [client] - Optional PG client for transactional queries.
 *
 * ### Returns
 * @returns {Promise<boolean>} `true` if the status exists; otherwise `false`.
 *
 * ### Throws
 * @throws {AppError} - Database error if the query execution fails.
 *
 * ### Example
 * ```js
 * const exists = await checkStatusExists(statusId, client);
 * if (!exists) {
 *   throw AppError.validationError('Invalid status ID.');
 * }
 * ```
 */
const checkStatusExists = async (statusId, client) => {
  const sql = `
    SELECT EXISTS (
      SELECT 1
      FROM status
      WHERE id = $1
    ) AS exists;
  `;

  try {
    const { rows } = await query(sql, [statusId], client);
    return rows[0]?.exists ?? false;
  } catch (error) {
    logSystemException(error, '', {
      context: 'status-repository/checkStatusExists',
    });

    throw AppError.databaseError('Failed to execute status existence check.', {
      context: 'status-repository/checkStatusExists',
      query: sql,
      params: [statusId],
      originalError: error.message,
    });
  }
};

/**
 * Repository: Fetch All Status Records
 *
 * Retrieves all status entries from the `status` table, ordered alphabetically by name.
 *
 * ### Purpose
 * - Used for initializing in-memory caches (e.g., STATUS_CODE_MAP).
 * - Supports admin UIs and configuration dashboards displaying available statuses.
 * - Independent of STATUS_KEY_LOOKUP or other cached ID maps.
 *
 * ### Parameters
 * @param {import('pg').PoolClient} [client] - Optional PostgreSQL client for transactional context.
 *
 * ### Returns
 * @returns {Promise<Array<{
 *   id: string,
 *   name: string,
 *   is_active: boolean
 * }>>}
 *   Array of status records with minimal fields required for caching and UI usage.
 *
 * ### Throws
 * @throws {AppError} - If the database query fails.
 *
 * ### Example
 * ```js
 * const statuses = await fetchAllStatuses();
 * console.log(statuses);
 * // → [{ id: 'uuid-1', name: 'ACTIVE', is_active: true }, ...]
 * ```
 */
const getAllStatuses = async (client) => {
  const sql = `
    SELECT
      id,
      name,
      is_active
    FROM status
    ORDER BY name ASC;
  `;

  try {
    const { rows } = await query(sql, [], client);
    return rows;
  } catch (error) {
    logSystemException(error, 'Failed to fetch all statuses', {
      context: 'status-repository/getAllStatuses',
    });
    throw AppError.databaseError('Failed to load all statuses.', {
      context: 'status-repository/getAllStatuses',
      details: error.message,
    });
  }
};

/**
 * Fetches status records for lookup dropdowns or autocomplete components.
 *
 * This is a lightweight, paginated status lookup that supports
 * optional filtering by:
 *   - name (keyword)
 *   - is_active
 *   - id
 *
 * Intended for UI dropdowns selecting status_id for SKU, product,
 * pricing types, inventory, etc.
 *
 * @param {Object} options - Query options.
 * @param {Object} [options.filters={}] - Dynamic filters (name, is_active, keyword, id).
 * @param {number} [options.limit=50] - Max rows returned.
 * @param {number} [options.offset=0] - Pagination offset.
 *
 * @returns {Promise<{
 *   data: Array<{
 *     id: string,
 *     name: string,
 *     description?: string,
 *     is_active: boolean
 *   }>,
 *   pagination: {
 *     offset: number,
 *     limit: number,
 *     totalRecords: number,
 *     hasMore: boolean
 *   }
 * }>}
 *
 * @throws {AppError} If database fails.
 */
const getStatusLookup = async ({ filters = {}, limit = 50, offset = 0 }) => {
  const context = 'status-repository/getStatusLookup';

  const tableName = 'status s';

  // Step 1: Build dynamic WHERE clause for status
  const { whereClause, params } = buildStatusLookupFilters(filters);

  // Step 2: Lightweight SELECT for dropdown
  const queryText = `
    SELECT
      s.id,
      s.name,
      s.is_active
    FROM ${tableName}
    WHERE ${whereClause}
  `;

  try {
    // Step 3: Run paginated query
    const result = await paginateQueryByOffset({
      tableName,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 's.name',
      sortOrder: 'ASC',
      additionalSort: 's.created_at ASC',
    });

    logSystemInfo('Fetched status lookup data', {
      context,
      offset,
      limit,
      filters,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch status lookup', {
      context,
      offset,
      limit,
      filters,
    });
    throw AppError.databaseError('Failed to fetch status lookup.');
  }
};

module.exports = {
  resolveStatusIdByName,
  getPaginatedStatuses,
  getStatusById,
  checkStatusExists,
  getAllStatuses,
  getStatusLookup,
};
