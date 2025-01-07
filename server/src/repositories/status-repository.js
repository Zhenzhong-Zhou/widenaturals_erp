const { query } = require('../database/db');
const paginateQuery = require('./query-pagination');

/**
 * Fetches the ID of a status by its name.
 *
 * @param {string} statusName - The name of the status.
 * @returns {Promise<uuid|null>} - The status ID or null if not found.
 */
const getStatusIdByName = async (statusName) => {
  if (!statusName) {
    throw new Error('Status name is required');
  }
  const result = await queryStatus('LOWER(name) = LOWER($1)', [statusName]);
  return result ? result.id : null;
};


/**
 * Fetches the ID and name of a status by its ID.
 *
 * @param {uuid} id - The ID of the status.
 * @returns {Promise<{ id: uuid, name: string } | null>} - The status object (ID and name) or null if not found.
 */
const getStatusNameById = async (id) => {
  if (!id) {
    throw new Error('Status ID is required');
  }
  return queryStatus('id = $1', [id]);
};

/**
 * Generalized query to fetch a status by a condition.
 *
 * @param {string} whereClause - SQL condition for the query.
 * @param {Array} params - Parameters for the query.
 * @returns {Promise<{ id: uuid, name: string } | null>} - The status object or null if not found.
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
    console.error(`Error executing query for condition (${whereClause}):`, error.message);
    throw new Error('Database query error');
  }
};

/**
 * Fetches paginated statuses with their details.
 *
 * @param {number} page - Current page number (1-based index).
 * @param {number} limit - Number of records per page.
 * @returns {Promise<{ data: Array<{ id: uuid, name: string, description: string, is_active: boolean, created_at: timestamp }>, pagination: { page: number, limit: number, totalRecords: number, totalPages: number } }>}
 */
const getAllStatuses = async (page = 1, limit = 10) => {
  const baseQuery = `
    SELECT id, name, description, is_active, created_at
    FROM status
  `;
  
  const countQuery = `
    SELECT COUNT(*) AS count
    FROM status
  `;
  
  try {
    // Use paginateQuery to handle pagination
    const result = await paginateQuery({
      queryText: baseQuery,
      countQueryText: countQuery,
      page,
      limit,
      sortBy: 'created_at',
      sortOrder: 'DESC',
    });
    return result; // Return paginated data and pagination metadata
  } catch (error) {
    console.error('Error fetching paginated statuses:', error.message);
    throw new Error('Failed to fetch statuses from the database.');
  }
};

/**
 * Fetches filtered statuses with sorting.
 *
 * @param {boolean|null} isActive - Filter by active status (true/false). Pass `null` for no filter.
 * @param {string} sortBy - Column to sort by (e.g., "name" or "created_at").
 * @param {string} sortOrder - Order of sorting ("ASC" or "DESC").
 * @returns {Promise<Array<{ id: uuid, name: string, description: string, is_active: boolean, created_at: timestamp }>>}
 */
const getFilteredStatuses = async (isActive = null, sortBy = 'created_at', sortOrder = 'DESC') => {
  const filters = [];
  const params = [];
  
  if (isActive !== null) {
    filters.push('is_active = $1');
    params.push(isActive);
  }
  
  const whereClause = filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';
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
    console.error('Error fetching filtered statuses:', error.message);
    throw new Error('Failed to fetch filtered statuses from the database.');
  }
};


/**
 * Fetches the details of a status by its ID.
 *
 * @param {uuid} id - The ID of the status to fetch.
 * @returns {Promise<{ id: uuid, name: string, description: string, is_active: boolean, created_at: timestamp } | null>}
 * - Returns the status object if found, otherwise null.
 * @throws {Error} - Throws an error if the query fails or if the ID is not provided.
 */
const getStatusById = async (id) => {
  if (!id) {
    throw new Error('Status ID is required');
  }
  
  const text = `
    SELECT id, name, description, is_active, created_at
    FROM status
    WHERE id = $1;
  `;
  const params = [id];
  
  try {
    const result = await query(text, params);
    return result.rows[0] || null; // Return the status object or null if not found
  } catch (error) {
    console.error('Error fetching status by ID:', error.message);
    throw new Error('Failed to fetch the status from the database.');
  }
};

module.exports = {
  getStatusIdByName,
  getStatusNameById,
  getAllStatuses,
  getFilteredStatuses,
  getStatusById
};
