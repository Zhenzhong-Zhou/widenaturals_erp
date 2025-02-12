const { query, paginateQuery, retry } = require('../database/db');
const AppError = require('../utils/AppError');
const { logInfo, logError } = require('../utils/logger-helper');

/**
 * Fetches all location types from the database.
 *
 * @param {Object} options - Query options.
 * @param {number} [options.page=1] - The page number for pagination.
 * @param {number} [options.limit=10] - The number of records per page.
 * @param {string} [options.sortBy='name'] - Column to sort by.
 * @param {string} [options.sortOrder='ASC'] - Sort order ('ASC' or 'DESC').
 * @returns {Promise<Object>} - A paginated list of location types.
 * @throws {AppError} - Throws an error if the query fails.
 */
const getLocationTypes = async ({ page = 1, limit = 10, sortBy = 'name', sortOrder = 'ASC' } = {}) => {
  const tableName = 'location_types lt';
  const joins = [
    'LEFT JOIN status s ON lt.status_id = s.id',
    'LEFT JOIN users u1 ON lt.created_by = u1.id',
    'LEFT JOIN users u2 ON lt.updated_by = u2.id',
  ];
  const whereClause = '1=1';
  
  // Validating sorting inputs
  const validSortColumns = ['name', 'code', 'status_date', 'created_at', 'updated_at'];
  if (!validSortColumns.includes(sortBy)) {
    throw new AppError(`Invalid sort column: ${sortBy}`, 400);
  }
  if (!['ASC', 'DESC'].includes(sortOrder.toUpperCase())) {
    throw new AppError(`Invalid sort order: ${sortOrder}`, 400);
  }
  
  // SQL Queries
  const dataQuery = `
    SELECT
      lt.id AS location_type_id,
      lt.name AS location_type_name,
      lt.description AS location_type_description,
      s.id AS status_id,
      s.name AS status_name,
      lt.status_date,
      lt.created_at,
      lt.updated_at,
      COALESCE(u1.firstname || ' ' || u1.lastname, 'Unknown') AS created_by,
      COALESCE(u2.firstname || ' ' || u2.lastname, 'Unknown') AS updated_by
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: dataQuery,
        params: [],
        page,
        limit,
        sortBy: `lt.${sortBy}`,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching location types:', error);
    throw new AppError('Failed to fetch location types', 500, error);
  }
};

/**
 * Fetches detailed information of a location type by its ID.
 *
 * This function retrieves:
 * - Location type details (name, code, description, status).
 * - Associated locations (name, address, warehouse fee, status).
 * - Created and updated user details.
 * - Supports pagination and sorting for locations.
 *
 * @async
 * @function getLocationDetailById
 * @param {Object} params - Query parameters.
 * @param {string} params.id - The UUID of the location type to fetch.
 * @param {number} [params.page=1] - The page number for paginated location results.
 * @param {number} [params.limit=10] - The number of locations per page.
 * @param {string} [params.sortBy='created_at'] - Column name to sort the results.
 * @param {string} [params.sortOrder='ASC'] - Sort order (`ASC` or `DESC`).
 * @returns {Promise<Object>} - A Promise resolving to an object containing location type details.
 * @throws {AppError} - Throws an error if the query fails.
 */
const getLocationDetailById = async ({ id, page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'ASC' }) => {
  const tableName = 'location_types lt';
  const joins = [
    'LEFT JOIN locations l ON lt.id = l.location_type_id',
    'LEFT JOIN status s ON lt.status_id = s.id',
    'LEFT JOIN status ls ON l.status_id = ls.id',
    'LEFT JOIN users u1 ON lt.created_by = u1.id',
    'LEFT JOIN users u2 ON lt.updated_by = u2.id',
    'LEFT JOIN users u3 ON l.created_by = u3.id',
    'LEFT JOIN users u4 ON l.updated_by = u4.id',
  ];
  
  const whereClause = 'lt.id = $1';
  
  const baseQuery = `
    SELECT
      lt.id AS location_type_id,
      lt.code AS location_type_code,
      lt.name AS location_type_name,
      lt.description AS location_type_description,
      lt.status_id,
      s.name AS status_name,
      lt.status_date,
      lt.created_at,
      lt.updated_at,
      COALESCE(
          STRING_AGG(DISTINCT u1.firstname || ' ' || u1.lastname, ', '), 'Unknown'
      ) AS created_by,
      COALESCE(
          STRING_AGG(DISTINCT u2.firstname || ' ' || u2.lastname, ', '), 'Unknown'
      ) AS updated_by,
      COALESCE(
          JSON_AGG(
              JSONB_BUILD_OBJECT(
                  'location_id', l.id,
                  'location_name', l.name,
                  'address', l.address,
                  'status_id', l.status_id,
                  'status_name', ls.name,
                  'status_date', l.status_date,
                  'created_at', l.created_at,
                  'updated_at', l.updated_at,
                  'created_by', COALESCE(u3.firstname || ' ' || u3.lastname, 'Unknown'),
                  'updated_by', COALESCE(u4.firstname || ' ' || u4.lastname, 'Unknown')
              )
          ) FILTER (WHERE l.id IS NOT NULL), '[]'
      ) AS locations
    FROM ${tableName}
    ${joins.join(' ')}
    WHERE ${whereClause}
    GROUP BY lt.id, lt.code, lt.name, lt.description, lt.status_id, s.name, lt.status_date, lt.created_at, lt.updated_at
  `;
  
  try {
    return await retry(async () => {
      return await paginateQuery({
        tableName,
        joins,
        whereClause,
        queryText: baseQuery,
        params: [id],
        page,
        limit,
        sortBy: `lt.${sortBy}`,
        sortOrder,
      });
    });
  } catch (error) {
    logError('Error fetching location type detail by ID:', error);
    throw new AppError('Failed to fetch location detail by ID', 500, error);
  }
};

module.exports = {
  getLocationTypes,
  getLocationDetailById,
};
