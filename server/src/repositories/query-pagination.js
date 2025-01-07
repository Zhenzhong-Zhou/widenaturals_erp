const AppError = require('../utils/app-error');
const { query } = require('../database/db');

/**
 * Executes a paginated SQL query with optional sorting and filtering.
 *
 * @param {Object} options - The options for the paginated query.
 * @param {string} options.queryText - Base SQL query without pagination (e.g., "SELECT * FROM table_name WHERE condition").
 * @param {string} options.countQueryText - SQL query to count total records (e.g., "SELECT COUNT(*) FROM table_name WHERE condition").
 * @param {Array} [options.params=[]] - Query parameters for the base query.
 * @param {number} [options.page=1] - Current page number (1-based index).
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy='id'] - Column to sort by (default: 'id').
 * @param {string} [options.sortOrder='ASC'] - Sorting order ('ASC' or 'DESC').
 * @returns {Promise<Object>} - Returns an object with `data` (records) and `pagination` (metadata).
 * @throws {AppError} - Throws an error if the query execution fails.
 */
const paginateQuery = async ({
                               queryText,
                               countQueryText,
                               params = [],
                               page = 1,
                               limit = 10,
                               sortBy = 'id',
                               sortOrder = 'ASC',
                             }) => {
  // Validate inputs
  if (!Number.isInteger(page) || page < 1) {
    throw new AppError('Page number must be a positive integer.', 400, {
      type: 'ValidationError',
      isExpected: true,
    });
  }
  
  if (!Number.isInteger(limit) || limit < 1) {
    throw new AppError('Limit must be a positive integer.', 400, {
      type: 'ValidationError',
      isExpected: true,
    });
  }
  
  const offset = (page - 1) * limit;
  
  // Ensure valid sort order
  const validSortOrder = ['ASC', 'DESC'].includes(sortOrder.toUpperCase())
    ? sortOrder.toUpperCase()
    : 'ASC';
  
  // Append ORDER BY, LIMIT, and OFFSET to the query
  const paginatedQuery = `
    ${queryText}
    ORDER BY ${sortBy} ${validSortOrder}
    LIMIT $${params.length + 1} OFFSET $${params.length + 2};
  `;
  
  try {
    // Execute both the paginated query and the count query in parallel
    const [dataResult, countResult] = await Promise.all([
      query(paginatedQuery, [...params, limit, offset]),
      query(countQueryText, params),
    ]);
    
    if (!countResult.rows.length) {
      throw new AppError('Failed to fetch total record count.', 500, {
        type: 'DatabaseError',
      });
    }
    
    const totalRecords = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalRecords / limit);
    
    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
      },
    };
  } catch (error) {
    throw new AppError(
      'Failed to execute paginated query.',
      500,
      {
        type: 'DatabaseError',
        isExpected: false,
        details: {
          query: queryText,
          params,
          errorMessage: error.message,
        },
      }
    );
  }
};

module.exports = paginateQuery;
