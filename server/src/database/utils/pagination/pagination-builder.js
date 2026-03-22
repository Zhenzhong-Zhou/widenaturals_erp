const AppError = require('../../../utils/AppError');

/**
 * Builds a SQL COUNT query with optional JOINs and filtering.
 *
 * SECURITY:
 * - `tableName`, `joins`, `whereClause`, and `distinctColumn` MUST be
 *   pre-validated or constructed internally (DO NOT pass raw user input).
 *
 * Behavior:
 * - Supports COUNT(*) or COUNT(DISTINCT column)
 * - Allows dynamic JOIN clauses
 * - Applies filtering via WHERE clause
 *
 * @param {string} tableName - Main table with optional alias (e.g., 'skus s')
 * @param {string[]} [joins=[]] - Array of JOIN clauses (pre-validated)
 * @param {string} [whereClause='1=1'] - WHERE condition (pre-built and safe)
 * @param {boolean} [useDistinct=false] - Whether to count distinct values
 * @param {string} [distinctColumn] - Column for DISTINCT count (required if useDistinct=true)
 *
 * @returns {string} SQL COUNT query
 *
 * @throws {AppError} If inputs are invalid
 *
 * @example
 * generateCountQuery(
 *   'skus s',
 *   ['LEFT JOIN products p ON s.product_id = p.id'],
 *   'p.brand IS NOT NULL',
 *   true,
 *   's.id'
 * );
 *
 * // SELECT COUNT(DISTINCT s.id) AS total
 * // FROM skus s
 * // LEFT JOIN products p ON s.product_id = p.id
 * // WHERE p.brand IS NOT NULL
 */
const generateCountQuery = (
  tableName,
  joins = [],
  whereClause = '1=1',
  useDistinct = false,
  distinctColumn
) => {
  //--------------------------------------------------
  // Validate inputs
  //--------------------------------------------------
  if (!tableName || typeof tableName !== 'string') {
    throw AppError.validationError('Invalid tableName');
  }
  
  if (!Array.isArray(joins)) {
    throw AppError.validationError('joins must be an array of strings');
  }
  
  if (typeof whereClause !== 'string') {
    throw AppError.validationError('Invalid whereClause');
  }
  
  if (useDistinct && !distinctColumn) {
    throw AppError.validationError(
      'distinctColumn is required when useDistinct is true'
    );
  }
  
  //--------------------------------------------------
  // Build query parts
  //--------------------------------------------------
  const joinClause = joins.length > 0 ? joins.join(' ') : '';
  
  const countExpr = useDistinct
    ? `COUNT(DISTINCT ${distinctColumn})`
    : 'COUNT(*)';
  
  //--------------------------------------------------
  // Construct final query
  //--------------------------------------------------
  return `
    SELECT ${countExpr} AS total
    FROM ${tableName}
    ${joinClause}
    WHERE ${whereClause}
  `;
};

/**
 * Constructs a paginated SQL query by appending `ORDER BY`, `LIMIT`, and `OFFSET`
 * clauses to a base query.
 *
 * SECURITY:
 * - `sortBy` and `additionalSort` MUST be validated or whitelisted before passing.
 * - This function does NOT sanitize raw SQL identifiers.
 *
 * Behavior:
 * - Applies primary and optional secondary sorting
 * - Enforces safe `LIMIT` and `OFFSET` parameter placeholders
 * - Ensures deterministic ordering for pagination
 *
 * @param {Object} options
 * @param {string} options.baseQuery - Base SQL query (without ORDER BY / LIMIT / OFFSET)
 * @param {string} [options.sortBy] - Column name (must be pre-validated)
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC'] - Sort direction
 * @param {string} [options.additionalSort] - Additional validated sort clause(s)
 * @param {number} options.paramIndex - Current parameter index (e.g., params.length)
 * @param {string} [options.defaultSort='id ASC'] - Fallback sort for stable pagination
 *
 * @returns {string} Final SQL query with pagination applied
 *
 * @example
 * const query = buildPaginatedQuery({
 *   baseQuery: 'SELECT * FROM products',
 *   sortBy: 'created_at',
 *   sortOrder: 'DESC',
 *   paramIndex: 2,
 * });
 *
 * // SELECT * FROM products
 * // ORDER BY created_at DESC
 * // LIMIT $3 OFFSET $4
 */
const buildPaginatedQuery = ({
                               baseQuery,
                               sortBy,
                               sortOrder = 'ASC',
                               additionalSort,
                               paramIndex,
                               defaultSort = 'id ASC',
                             }) => {
  //--------------------------------------------------
  // Validate inputs (fail fast)
  //--------------------------------------------------
  if (!baseQuery || typeof baseQuery !== 'string') {
    throw AppError.validationError('Invalid baseQuery');
  }
  
  if (typeof paramIndex !== 'number' || paramIndex < 0) {
    throw AppError.validationError('Invalid paramIndex');
  }
  
  let query = baseQuery.trim();
  
  //--------------------------------------------------
  // Normalize sort order
  //--------------------------------------------------
  const normalizedOrder =
    ['ASC', 'DESC'].includes(sortOrder?.toUpperCase())
      ? sortOrder.toUpperCase()
      : 'ASC';
  
  //--------------------------------------------------
  // Build ORDER BY clause
  //--------------------------------------------------
  let orderClause;
  
  if (sortBy) {
    orderClause = `${sortBy} ${normalizedOrder}`;
    
    if (additionalSort) {
      orderClause += `, ${additionalSort}`;
    }
  } else {
    // Ensure stable pagination
    orderClause = defaultSort;
  }
  
  query += ` ORDER BY ${orderClause}`;
  
  //--------------------------------------------------
  // Append pagination (parameterized)
  //--------------------------------------------------
  query += ` LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
  
  return query;
};

module.exports = {
  generateCountQuery,
  buildPaginatedQuery,
};
