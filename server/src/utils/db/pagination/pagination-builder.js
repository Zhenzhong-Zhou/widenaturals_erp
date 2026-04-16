const AppError = require('../../AppError');
const { safeOrderBy, q } = require('../../sql-ident');

/**
 * Builds a SQL COUNT query with optional JOINs and filtering.
 *
 * SECURITY:
 * - tableName, joins, and whereClause MUST be internally constructed (NOT user input)
 * - distinctColumn MUST be a safe identifier (validated via q())
 *
 * BEHAVIOR:
 * - Supports COUNT(*) or COUNT(DISTINCT column)
 * - Allows dynamic JOIN clauses
 * - Applies filtering via WHERE clause
 *
 * CONTRACT:
 * - This function does NOT sanitize raw SQL fragments (joins, whereClause)
 * - Caller is responsible for ensuring SQL safety for those parts
 *
 * @param {string} tableName - Main table with optional alias (e.g., 'skus s')
 * @param {string[]} [joins=[]] - Array of JOIN clauses (trusted SQL)
 * @param {string} [whereClause='1=1'] - WHERE condition (trusted SQL)
 * @param {boolean} [useDistinct=false]
 * @param {string} [distinctColumn] - Safe identifier (e.g., 's.id')
 *
 * @returns {string} SQL COUNT query
 *
 * @throws {AppError} validationError if inputs are invalid
 */
const generateCountQuery = (
  tableName,
  joins = [],
  whereClause = '1=1',
  useDistinct = false,
  distinctColumn
) => {
  const context = 'pagination/generateCountQuery';
  
  //--------------------------------------------------
  // Validate tableName
  //--------------------------------------------------
  if (typeof tableName !== 'string' || tableName.trim().length === 0) {
    throw AppError.validationError('Invalid tableName', { context });
  }
  
  //--------------------------------------------------
  // Validate joins
  //--------------------------------------------------
  if (!Array.isArray(joins)) {
    throw AppError.validationError('joins must be an array', { context });
  }
  
  for (const join of joins) {
    if (typeof join !== 'string' || join.trim().length === 0) {
      throw AppError.validationError('Invalid join clause', {
        context,
        meta: { join },
      });
    }
  }
  
  //--------------------------------------------------
  // Validate whereClause
  //--------------------------------------------------
  if (typeof whereClause !== 'string') {
    throw AppError.validationError('Invalid whereClause', { context });
  }
  
  //--------------------------------------------------
  // Validate distinct usage
  //--------------------------------------------------
  let countExpr;
  
  if (useDistinct) {
    if (!distinctColumn || typeof distinctColumn !== 'string') {
      throw AppError.validationError(
        'distinctColumn is required when useDistinct is true',
        { context }
      );
    }
    
    // SAFE identifier quoting
    const safeColumn = q(distinctColumn);
    
    countExpr = `COUNT(DISTINCT ${safeColumn})`;
  } else {
    countExpr = 'COUNT(*)';
  }
  
  //--------------------------------------------------
  // Build JOIN clause
  //--------------------------------------------------
  const joinClause = joins.length ? `\n    ${joins.join('\n    ')}` : '';
  
  //--------------------------------------------------
  // Construct query
  //--------------------------------------------------
  return `
    SELECT ${countExpr} AS total
    FROM ${tableName}${joinClause}
    WHERE ${whereClause}
    `.trim();
};

/**
 * Constructs a paginated SQL query with ORDER BY, LIMIT, and OFFSET.
 *
 * SECURITY:
 * - All sortable columns MUST be validated via whitelistSet
 * - Delegates ORDER BY safety to `safeOrderBy`
 * - `rawOrderBy` is allowed ONLY for trusted internal usage
 *
 * BEHAVIOR:
 * - Applies primary sort (user-provided or fallback)
 * - Supports additional secondary sorts (explicit direction allowed)
 * - Ensures deterministic ordering for pagination
 * - Uses parameterized LIMIT and OFFSET
 *
 * SORTING RULES:
 * - `sortBy` must exist in whitelistSet
 * - `additionalSorts` must be valid column definitions
 * - Direction is normalized to ASC/DESC
 *
 * PARAM INDEX:
 * - LIMIT uses $paramIndex + 1
 * - OFFSET uses $paramIndex + 2
 * - Caller must ensure params array alignment
 *
 * EXAMPLE:
 *   ORDER BY "r"."hierarchy_level" ASC, "r"."name" ASC
 *
 * @param {Object} options
 * @param {string} options.baseQuery - SQL query without ORDER BY/LIMIT/OFFSET
 * @param {string} [options.sortBy]
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']
 * @param {(string | { column: string, direction: 'ASC' | 'DESC' })[]} [options.additionalSorts=[]]
 * @param {string} [options.rawOrderBy] - INTERNAL ONLY (bypasses validation)
 * @param {number} options.paramIndex - Current parameter index (params.length)
 * @param {string} [options.defaultSort='id']
 * @param {Set<string>} options.whitelistSet
 *
 * @returns {string}
 *
 * @throws {AppError} validationError
 */
const buildPaginatedQuery = ({
                               baseQuery,
                               sortBy,
                               sortOrder = 'ASC',
                               additionalSorts = [],
                               rawOrderBy,
                               paramIndex,
                               defaultSort,
                               whitelistSet,
                             }) => {
  const context = 'pagination/buildPaginatedQuery';
  
  //--------------------------------------------------
  // Validate required inputs
  //--------------------------------------------------
  if (typeof baseQuery !== 'string' || baseQuery.trim().length === 0) {
    throw AppError.validationError('Invalid baseQuery', { context });
  }
  
  if (typeof paramIndex !== 'number' || paramIndex < 0) {
    throw AppError.validationError('Invalid paramIndex', { context });
  }
  
  let query = baseQuery.trim();
  
  //--------------------------------------------------
  // Normalize direction
  //--------------------------------------------------
  const normalizedOrder =
    String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  
  //--------------------------------------------------
  // PRIORITY: rawOrderBy (trusted internal use ONLY)
  //--------------------------------------------------
  if (rawOrderBy) {
    query += ` ORDER BY ${rawOrderBy}`;
    query += ` LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
    return query;
  }
  
  //--------------------------------------------------
  // Validate whitelist ONLY for dynamic sorting
  //--------------------------------------------------
  if (!(whitelistSet instanceof Set) || whitelistSet.size === 0) {
    throw AppError.validationError('Invalid whitelistSet', { context });
  }
  
  //--------------------------------------------------
  // Resolve primary sort
  //--------------------------------------------------
  const primarySort = sortBy || defaultSort;
  
  if (!primarySort) {
    throw AppError.validationError('Missing sortBy/defaultSort', { context });
  }
  
  //--------------------------------------------------
  // Build ORDER BY
  //--------------------------------------------------
  const orderParts = [];
  
  // Primary sort
  orderParts.push(
    safeOrderBy(primarySort, normalizedOrder, whitelistSet)
  );
  
  //--------------------------------------------------
  // Secondary sorts
  //--------------------------------------------------
  for (const item of additionalSorts) {
    if (typeof item === 'string') {
      orderParts.push(
        safeOrderBy(item, 'ASC', whitelistSet)
      );
      continue;
    }
    
    if (
      item &&
      typeof item === 'object' &&
      typeof item.column === 'string'
    ) {
      const dir =
        String(item.direction).toUpperCase() === 'DESC'
          ? 'DESC'
          : 'ASC';
      
      orderParts.push(
        safeOrderBy(item.column, dir, whitelistSet)
      );
      continue;
    }
    
    throw AppError.validationError('Invalid additionalSorts entry', {
      context,
      meta: { item },
    });
  }
  
  //--------------------------------------------------
  // Assemble final query
  //--------------------------------------------------
  query += ` ORDER BY ${orderParts.join(', ')}`;
  query += ` LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`;
  
  return query;
};

module.exports = {
  generateCountQuery,
  buildPaginatedQuery,
};
