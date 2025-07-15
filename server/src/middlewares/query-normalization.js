const {
  normalizeFilterKeys,
  normalizePaginationParams,
  normalizeParamArray,
} = require('../utils/query-normalizers');
const {
  sanitizeSortBy,
  sanitizeSortOrder,
  getSortMapForModule
} = require('../utils/sort-utils');

/**
 * Middleware to normalize query parameters for filtering, sorting, and pagination.
 *
 * Normalization steps:
 * - Trims all query keys and values
 * - Converts pagination fields (`page`, `limit`) to integers
 * - Sanitizes `sortBy` and `sortOrder` based on the provided module's allowed sort field map
 * - Normalizes specified keys into arrays (e.g., 'statusId', 'createdBy')
 * - Converts specified keys to booleans (e.g., 'onlyWithAddress')
 * - Optionally limits which keys are included in the `filters` object
 * - Allows selective inclusion of pagination and sorting fields in `req.normalizedQuery`
 *
 * @param {string|null} moduleKey - Optional module key for sort mapping (e.g., 'orderTypeSortMap')
 * @param {string[]} arrayKeys - List of query keys to normalize as arrays (e.g., ['statusId', 'createdBy'])
 * @param {string[]} booleanKeys - List of query keys to normalize as booleans (e.g., ['onlyWithAddress'])
 * @param {string[]} filterKeys - List of keys to include in the `filters` object (e.g., ['statusId', 'orderType'])
 * @param {object} [options] - Optional configuration flags
 * @param {boolean} [options.includePagination=true] - Whether to include pagination fields (`limit`, `offset`, `page`)
 * @param {boolean} [options.includeSorting=true] - Whether to include sorting fields (`sortBy`, `sortOrder`)
 *
 * @returns {function} Express middleware that sets `req.normalizedQuery`
 */
const createQueryNormalizationMiddleware = (
  moduleKey = '',
  arrayKeys = [],
  booleanKeys = [],
  filterKeys = [],
  options = { includePagination: true, includeSorting: true }
) => {
  return (req, res, next) => {
    const rawQuery = req.query ?? {};
    
    // Step 1: Trim all keys and values in the raw query string
    const trimmedQuery = normalizeFilterKeys(rawQuery);
    
    // Step 2: Extract and normalize pagination parameters
    const { page, limit, sortOrder: rawSortOrder } = normalizePaginationParams(trimmedQuery);
    
    // Step 3: Retrieve module-specific sort field mapping and sanitize sort fields
    const sortMap = getSortMapForModule(moduleKey);
    const rawSortBy = trimmedQuery.sortBy ?? undefined;
    const sanitizedSortBy = sanitizeSortBy(rawSortBy, moduleKey) ?? sortMap?.defaultNaturalSort;
    const sanitizedSortOrder = sanitizeSortOrder(rawSortOrder);
    
    // Step 4: Normalize specified keys into arrays (e.g., statusId=1,2 => ['1', '2'])
    const normalizedArrays = {};
    for (const key of arrayKeys) {
      if (key in trimmedQuery) {
        const normalized = normalizeParamArray(trimmedQuery[key]);
        if (normalized?.length > 0) {
          normalizedArrays[key] = normalized;
        }
      }
    }
    
    // Step 5: Normalize specified keys into booleans (e.g., onlyActive='true' => true)
    const normalizedBooleans = {};
    for (const key of booleanKeys) {
      if (key in trimmedQuery) {
        const val = trimmedQuery[key];
        if (val === true || val === 'true') {
          normalizedBooleans[key] = true;
        } else if (val === false || val === 'false') {
          normalizedBooleans[key] = false;
        } else {
          normalizedBooleans[key] = undefined;
        }
      }
    }
    
    // Step 6: Filter query keys to include only those explicitly allowed in `filterKeys`
    const filters = {};
    for (const key of filterKeys) {
      if (trimmedQuery[key] !== undefined) filters[key] = trimmedQuery[key];
    }
    
    // Step 7: Build the final normalized object to be attached to the request
    const normalized = {
      filters: {
        ...filters,
        ...normalizedArrays,
        ...normalizedBooleans,
      },
    };
    
    // Step 8: Conditionally attach pagination fields
    if (options.includePagination !== false) {
      normalized.limit = limit;
      normalized.offset = Number(trimmedQuery.offset ?? 0);
    }
    
    // Step 9: Conditionally attach sorting fields
    if (options.includeSorting !== false) {
      normalized.sortBy = sanitizedSortBy;
      normalized.sortOrder = sanitizedSortOrder;
    }
    
    // Step 10: Attach page only if pagination is included and page exists
    if (options.includePagination && page !== undefined) {
      normalized.page = page;
    }
    
    // Step 11: Attach a final result to request for downstream use
    req.normalizedQuery = normalized;
    
    next();
  };
};

module.exports = createQueryNormalizationMiddleware;
