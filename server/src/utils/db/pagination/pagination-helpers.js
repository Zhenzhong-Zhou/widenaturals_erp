const { pool, query } = require('../../db');
const AppError = require('../../../utils/AppError');
const { generateCountQuery, buildPaginatedQuery } = require('./pagination-builder');
const { executePaginatedQueries } = require('./pagination-executor');
const { handleDbError } = require('../../../utils/errors/error-handlers');
const { logPaginatedQueryError } = require('../../../utils/db-logger');
const { validateSortingConfig } = require('../../../utils/query/sort-validator');

/**
 * Executes a page-based paginated query with optional sorting and total count.
 *
 * ARCHITECTURE:
 * - Converts page-based pagination into offset-based execution
 * - Delegates query construction and execution to:
 *   - buildPaginatedQuery
 *   - generateCountQuery
 *   - executePaginatedQueries
 *
 * SECURITY:
 * - queryText, joins, and whereClause MUST be internally constructed
 * - Supports two mutually exclusive sorting modes:
 *
 *   1) Dynamic sorting (SAFE)
 *      - Uses sortBy, sortOrder, additionalSorts
 *      - Requires whitelistSet for validation
 *
 *   2) Raw sorting (INTERNAL ONLY)
 *      - Uses rawOrderBy
 *      - Bypasses whitelist validation
 *      - MUST NOT contain user input
 *
 * SORTING RULES:
 * - Cannot mix rawOrderBy with dynamic sorting
 * - whitelistSet is required for dynamic sorting
 * - defaultSort is recommended to ensure deterministic ordering
 *
 * PAGINATION:
 * - Converts page → offset internally
 * - Uses LIMIT/OFFSET with parameter binding
 *
 * COUNT BEHAVIOR:
 * - Executes COUNT query by default
 * - If skipCount = true:
 *   - totalRecords and totalPages will be null
 *   - improves performance for large datasets
 *
 * PERFORMANCE:
 * - Parallel query execution for pool
 * - Sequential execution for transactions
 *
 * @param {Object} options
 * @param {string} options.queryText - Base SELECT query (without ORDER BY / LIMIT / OFFSET)
 * @param {string} options.tableName - Table used for COUNT query
 * @param {string[]} [options.joins=[]] - JOIN clauses (trusted SQL)
 * @param {string} [options.whereClause='1=1'] - WHERE clause (trusted SQL)
 * @param {any[]} [options.params=[]] - Query parameters
 *
 * @param {number} [options.page=1] - Page number (1-based)
 * @param {number} [options.limit=10] - Page size (max enforced)
 *
 * @param {string} [options.sortBy]
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC']
 * @param {(string | { column: string, direction: 'ASC'|'DESC' })[]} [options.additionalSorts=[]]
 *
 * @param {string} [options.rawOrderBy] - Raw ORDER BY clause (internal only)
 * @param {Set<string>} [options.whitelistSet] - Allowed columns for sorting
 * @param {string} [options.defaultSort] - Fallback sort column
 *
 * @param {import('pg').Pool|import('pg').PoolClient} [options.clientOrPool]
 * @param {Object} [options.meta={}] - Additional metadata for logging
 *
 * @param {boolean} [options.skipCount=false] - Skip COUNT query
 *
 * @returns {Promise<{
 *   data: any[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number | null,
 *     totalPages: number | null
 *   }
 * }>}
 *
 * @throws {AppError} validationError
 * @throws {AppError} databaseError
 */
const paginateQuery = async ({
                               queryText,
                               tableName,
                               joins = [],
                               whereClause = '1=1',
                               params = [],
                               page = 1,
                               limit = 10,
                               sortBy,
                               sortOrder = 'ASC',
                               additionalSorts = [],
                               rawOrderBy,
                               whitelistSet,
                               clientOrPool = pool,
                               meta = {},
                               skipCount = false,
                               defaultSort,
                             }) => {
  const context = 'pagination-helpers/paginateQuery';
  
  //--------------------------------------------------
  // Validate inputs
  //--------------------------------------------------
  if (page < 1 || limit < 1) {
    throw AppError.validationError('Page and limit must be positive integers.', { context });
  }
  
  const MAX_LIMIT = 100;
  if (limit > MAX_LIMIT) {
    throw AppError.validationError(`Limit cannot exceed ${MAX_LIMIT}`, { context });
  }
  
  if (!queryText || typeof queryText !== 'string') {
    throw AppError.validationError('Invalid queryText', { context });
  }
  
  //--------------------------------------------------
  // Validate sorting mode
  //--------------------------------------------------
  validateSortingConfig({
    sortBy,
    additionalSorts,
    rawOrderBy,
    whitelistSet,
    context,
  });
  
  //--------------------------------------------------
  // Pagination calculation
  //--------------------------------------------------
  const offset = (page - 1) * limit;
  
  //--------------------------------------------------
  // Build data query
  //--------------------------------------------------
  const paginatedQuery = buildPaginatedQuery({
    baseQuery: queryText,
    sortBy,
    sortOrder,
    additionalSorts,
    rawOrderBy,
    paramIndex: params.length,
    whitelistSet,
    defaultSort,
  });
  
  const queryParams = [...params, limit, offset];
  
  //--------------------------------------------------
  // Skip count optimization
  //--------------------------------------------------
  if (skipCount) {
    const result = await query(paginatedQuery, queryParams, clientOrPool);
    
    return {
      data: result.rows,
      pagination: {
        page,
        limit,
        totalRecords: null,
        totalPages: null,
      },
    };
  }
  
  //--------------------------------------------------
  // Build count query
  //--------------------------------------------------
  const countQueryText = generateCountQuery(
    tableName,
    joins,
    whereClause
  );
  
  try {
    //--------------------------------------------------
    // Execute queries
    //--------------------------------------------------
    const { rows, totalRecords } = await executePaginatedQueries({
      dataQuery: paginatedQuery,
      dataParams: queryParams,
      countQuery: countQueryText,
      countParams: params,
      clientOrPool,
    });
    
    const totalPages = Math.ceil(totalRecords / limit);
    
    return {
      data: rows,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
      },
    };
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to execute paginated query.',
      meta: { page, limit, ...meta },
      logFn: (err) =>
        logPaginatedQueryError(
          err,
          paginatedQuery,
          countQueryText,
          queryParams,
          { page, limit, ...meta }
        ),
    });
  }
};

/**
 * Executes an offset-based paginated query with optional sorting and total count.
 *
 * ARCHITECTURE:
 * - Orchestrates pagination by combining:
 *   - `buildPaginatedQuery` (data query with ORDER BY / LIMIT / OFFSET)
 *   - `generateCountQuery` (optional total count query)
 *   - `executePaginatedQueries` (execution layer)
 *
 * SECURITY:
 * - All SQL fragments (`queryText`, `joins`, `whereClause`) MUST be internally constructed
 *   and NEVER include raw user input
 * - Sorting supports two mutually exclusive modes:
 *
 *   1) Dynamic sorting (SAFE)
 *      - Uses `sortBy`, `sortOrder`, `additionalSorts`
 *      - Requires `whitelistSet` for strict column validation
 *
 *   2) Raw sorting (INTERNAL ONLY)
 *      - Uses `rawOrderBy`
 *      - Bypasses whitelist validation
 *      - MUST NOT contain any user input
 *
 * SORTING RULES:
 * - Cannot mix `rawOrderBy` with `sortBy` / `additionalSorts`
 * - `whitelistSet` is REQUIRED for dynamic sorting
 * - `defaultSort` should be provided if deterministic ordering is required
 *
 * PAGINATION:
 * - Uses LIMIT/OFFSET strategy
 * - LIMIT and OFFSET are parameterized (safe from SQL injection)
 * - Enforces a maximum limit to prevent abuse
 *
 * COUNT BEHAVIOR:
 * - By default, executes a COUNT query to return `totalRecords`
 * - If `skipCount = true`, skips COUNT query for performance
 *   → `totalRecords` will be null
 *   → `hasMore` is inferred from result size
 *
 * DISTINCT SUPPORT:
 * - If `useDistinct = true`, COUNT query uses COUNT(DISTINCT column)
 * - `distinctColumn` is required when `useDistinct = true`
 *
 * PERFORMANCE:
 * - Uses parallel execution for pool connections
 * - Uses sequential execution for transaction clients
 * - `skipCount` significantly improves performance on large datasets
 *
 * SORT MODES:
 * - Dynamic sorting (safe): requires whitelistSet
 * - Raw sorting (internal): uses rawOrderBy (bypasses validation)
 *
 * NOTE:
 * - rawOrderBy MUST NOT contain user input
 * - whitelistSet is required unless rawOrderBy is used
 *
 * PERFORMANCE:
 * - skipCount=true avoids COUNT query (faster for large datasets)
 *
 * @param {Object} options
 * @param {string} options.tableName - Main table (used for COUNT query)
 * @param {string[]} [options.joins=[]] - JOIN clauses (trusted SQL)
 * @param {string} [options.whereClause='1=1'] - WHERE condition (trusted SQL)
 * @param {string} options.queryText - Base SELECT query (without ORDER BY / LIMIT / OFFSET)
 * @param {any[]} [options.params=[]] - Query parameters
 * @param {number} [options.offset=0] - Number of rows to skip
 * @param {number} [options.limit=10] - Number of rows to fetch (max enforced)
 *
 * @param {string} [options.sortBy] - Primary sort key (dynamic sorting)
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC'] - Primary sort direction
 * @param {(string | { column: string, direction: 'ASC'|'DESC' })[]} [options.additionalSorts=[]]
 *        Secondary sort definitions
 *
 * @param {string} [options.rawOrderBy] - Raw ORDER BY clause (internal use only)
 * @param {Set<string>} [options.whitelistSet] - Allowed columns for dynamic sorting
 * @param {string} [options.defaultSort] - Fallback sort column (recommended)
 *
 * @param {import('pg').Pool|import('pg').PoolClient} [options.clientOrPool]
 *        Database connection (pool or transaction client)
 *
 * @param {Object} [options.meta={}] - Additional metadata for logging
 *
 * @param {boolean} [options.useDistinct=false] - Whether to use DISTINCT count
 * @param {string} [options.distinctColumn] - Column used for DISTINCT count
 *
 * @param {boolean} [options.skipCount=false] - Skip COUNT query for performance
 *
 * @returns {Promise<{
 *   data: any[],
 *   pagination: {
 *     offset: number,
 *     limit: number,
 *     totalRecords: number | null,
 *     hasMore: boolean
 *   }
 * }>}
 *
 * @throws {AppError} validationError - Invalid inputs or configuration
 * @throws {AppError} databaseError - Query execution failure
 *
 * @example
 * // Safe dynamic sorting
 * paginateQueryByOffset({
 *   tableName: 'skus s',
 *   queryText: 'SELECT s.id, s.sku FROM skus s',
 *   sortBy: 'sku',
 *   whitelistSet: SKU_SORT_WHITELIST,
 * });
 *
 * @example
 * // Raw internal sorting (complex SQL)
 * paginateQueryByOffset({
 *   queryText,
 *   rawOrderBy: 'MIN(p.brand) ASC, s.id',
 *   skipCount: true,
 * });
 */
const paginateQueryByOffset = async ({
                                       tableName,
                                       joins = [],
                                       whereClause = '1=1',
                                       queryText,
                                       params = [],
                                       offset = 0,
                                       limit = 10,
                                       sortBy,
                                       sortOrder = 'ASC',
                                       additionalSorts = [],
                                       rawOrderBy,
                                       whitelistSet,
                                       clientOrPool = pool,
                                       meta = {},
                                       useDistinct = false,
                                       distinctColumn,
                                       skipCount = false,
                                       defaultSort,
                                     }) => {
  const context = 'pagination-helpers/paginateQueryByOffset';
  
  //--------------------------------------------------
  // Validate inputs
  //--------------------------------------------------
  if (!tableName || typeof tableName !== 'string') {
    throw AppError.validationError('Invalid tableName', { context });
  }
  
  if (!Array.isArray(joins)) {
    throw AppError.validationError('joins must be an array', { context });
  }
  
  if (!Array.isArray(params)) {
    throw AppError.validationError('params must be an array', { context });
  }
  
  if (typeof whereClause !== 'string') {
    throw AppError.validationError('Invalid whereClause', { context });
  }
  
  if (!queryText || typeof queryText !== 'string') {
    throw AppError.validationError('Invalid queryText', { context });
  }
  
  if (offset < 0 || limit < 1) {
    throw AppError.validationError(
      'Offset must be >= 0 and limit must be a positive integer.',
      { context }
    );
  }
  
  const MAX_LIMIT = 100;
  if (limit > MAX_LIMIT) {
    throw AppError.validationError(`Limit cannot exceed ${MAX_LIMIT}`, {
      context,
    });
  }
  
  //--------------------------------------------------
  // Validate sorting mode
  //--------------------------------------------------
  validateSortingConfig({
    sortBy,
    additionalSorts,
    rawOrderBy,
    whitelistSet,
    context,
  });
  
  //--------------------------------------------------
  // Validate distinct
  //--------------------------------------------------
  if (useDistinct && !distinctColumn) {
    throw AppError.validationError(
      'distinctColumn must be provided when useDistinct is true.',
      { context }
    );
  }
  
  //--------------------------------------------------
  // Build paginated query
  //--------------------------------------------------
  const paginatedQuery = buildPaginatedQuery({
    baseQuery: queryText,
    sortBy,
    sortOrder,
    additionalSorts,
    rawOrderBy,
    paramIndex: params.length,
    whitelistSet,
    defaultSort,
  });
  
  const queryParams = [...params, limit, offset];
  
  //--------------------------------------------------
  // Skip count optimization
  //--------------------------------------------------
  if (skipCount) {
    const result = await query(paginatedQuery, queryParams, clientOrPool);
    
    return {
      data: result.rows,
      pagination: {
        offset,
        limit,
        totalRecords: null,
        hasMore: result.rows.length === limit,
      },
    };
  }
  
  //--------------------------------------------------
  // Build COUNT query
  //--------------------------------------------------
  const countQueryText = generateCountQuery(
    tableName,
    joins,
    whereClause,
    useDistinct,
    distinctColumn
  );
  
  //--------------------------------------------------
  // Execute queries
  //--------------------------------------------------
  try {
    const { rows, totalRecords } = await executePaginatedQueries({
      dataQuery: paginatedQuery,
      dataParams: queryParams,
      countQuery: countQueryText,
      countParams: params,
      clientOrPool,
    });
    
    return {
      data: rows,
      pagination: {
        offset,
        limit,
        totalRecords,
        hasMore: offset + rows.length < totalRecords,
      },
    };
  } catch (error) {
    throw handleDbError(error, {
      context,
      message: 'Failed to execute offset-based paginated query.',
      meta: {
        offset,
        limit,
        useDistinct,
        distinctColumn,
        ...meta,
      },
      logFn: (err) =>
        logPaginatedQueryError(
          err,
          paginatedQuery,
          countQueryText,
          queryParams,
          {
            offset,
            limit,
            useDistinct,
            distinctColumn,
            ...meta,
          }
        ),
    });
  }
};

module.exports = {
  paginateQuery,
  paginateQueryByOffset,
};
