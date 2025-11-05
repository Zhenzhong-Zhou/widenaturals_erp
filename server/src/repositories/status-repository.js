const AppError = require('../utils/AppError');
const { query, paginateResults } = require('../database/db');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');

/**
 * Fetches the ID of a status by its name.
 *
 * @param {string} statusName - The name of the status.
 * @returns {Promise<uuid|null>} - The status ID or null if not found.
 * @throws {AppError} - Throws an error if the name is missing or the query fails.
 */
const getStatusIdByName = async (statusName) => {
  if (!statusName) {
    throw AppError('Status name is required');
  }
  const result = await queryStatus('LOWER(name) = LOWER($1)', [statusName]);
  return result ? result.id : null;
};

/**
 * Fetches the ID and name of a status by its ID.
 *
 * @param {uuid} id - The ID of the status.
 * @returns {Promise<{ id: uuid, name: string } | null>} - The status object (ID and name) or null if not found.
 * @throws {AppError} - Throws an error if the ID is missing or the query fails.
 */
const getStatusNameById = async (id) => {
  if (!id) {
    throw AppError.validationError('Status ID is required');
  }
  return queryStatus('id = $1', [id]);
};

/**
 * Generalized query to fetch a status by a condition.
 *
 * @param {string} whereClause - SQL condition for the query.
 * @param {Array} params - Parameters for the query.
 * @returns {Promise<{ id: uuid, name: string } | null>} - The status object or null if not found.
 * @throws {AppError} - Throws an error if the query fails.
 */
const queryStatus = async (whereClause, params) => {
  const text = `
    SELECT id, name
    FROM status
    WHERE ${whereClause}
    LIMIT 1;
  `;
  try {
    const result = await query(text, params);
    return result.rows[0] || null;
  } catch (error) {
    throw AppError.databaseError('Database query error while fetching status');
  }
};

/**
 * Repository: Get Paginated Statuses
 *
 * Retrieves all statuses with pagination and consistent structured logging.
 * Intended for simple admin UI tables or configuration dashboards.
 *
 * ### Features
 * - Lightweight query (no joins or filters)
 * - Consistent pagination metadata and structured logs
 * - Safe parameterization for page/limit values
 *
 * ### Example
 * ```js
 * const result = await getPaginatedStatuses({ page: 1, limit: 20 });
 * ```
 *
 * ### Returns
 * ```js
 * {
 *   data: [ { id, name, description, is_active, created_at, updated_at } ],
 *   pagination: { totalRecords, totalPages, page, limit }
 * }
 * ```
 *
 * @async
 * @function
 * @param {Object} options
 * @param {number} [options.page=1] - Current page (1-based)
 * @param {number} [options.limit=10] - Records per page
 * @param {string} [options.sortBy='name'] - Sort column
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC'] - Sort direction
 *
 * @returns {Promise<{
 * data: any[],
 * pagination: {
 * page: number, limit: number, totalRecords: number, totalPages: number
 * } }
 * >}
 *
 * @throws {AppError} - If database execution fails
 */
const getPaginatedStatuses = async ({
                                      page = 1,
                                      limit = 10,
                                      sortBy = 'name',
                                      sortOrder = 'ASC',
                                    }) => {
  const queryText = `
    SELECT
      s.id,
      s.name,
      s.description,
      s.is_active,
      s.created_at,
      s.updated_at
    FROM status AS s
    ORDER BY ${sortBy} ${sortOrder};
  `;
  
  try {
    // Execute with pagination helper
    const result = await paginateResults({
      dataQuery: queryText,
      page,
      limit,
      meta: {
        context: 'status-repository/getPaginatedStatuses',
      },
    });
    
    // Handle empty result
    if (!result?.data?.length) {
      logSystemInfo('No statuses found for current query', {
        context: 'status-repository/getPaginatedStatuses',
        pagination: { page, limit },
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
    
    // Log success
    logSystemInfo('Fetched paginated statuses successfully', {
      context: 'status-repository/getPaginatedStatuses',
      pagination: result.pagination,
      sorting: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated statuses', {
      context: 'status-repository/getPaginatedStatuses',
      pagination: { page, limit },
      sorting: { sortBy, sortOrder },
    });
    
    throw AppError.databaseError('Failed to fetch paginated statuses.', {
      context: 'status-repository/getPaginatedStatuses',
      details: error.message,
    });
  }
};

/**
 * Fetches filtered statuses with sorting.
 *
 * @param {boolean|null} isActive - Filter by active status (true/false). Pass `null` for no filter.
 * @param {string} sortBy - Column to sort by (e.g., "name" or "created_at").
 * @param {string} sortOrder - Order of sorting ("ASC" or "DESC").
 * @returns {Promise<Array>} - Array of filtered statuses.
 * @throws {AppError} - Throws an error if the query fails.
 */
const getFilteredStatuses = async (
  isActive = null,
  sortBy = 'created_at',
  sortOrder = 'DESC'
) => {
  const filters = [];
  const params = [];

  if (isActive !== null) {
    filters.push('is_active = $1');
    params.push(isActive);
  }

  const whereClause =
    filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
  const text = `
    SELECT id, name, description, is_active, created_at
    FROM status
    ${whereClause}
    ORDER BY ${sortBy} ${sortOrder};
  `;

  try {
    const result = await query(text, params);
    return result.rows || [];
  } catch (error) {
    throw AppError.databaseError(
      'Failed to fetch filtered statuses from the database'
    );
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

module.exports = {
  getStatusIdByName,
  getStatusNameById,
  getPaginatedStatuses,
  getFilteredStatuses,
  getStatusById,
  checkStatusExists,
  getAllStatuses,
};
