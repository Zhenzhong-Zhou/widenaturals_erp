const {
  normalizeFilterKeys,
  normalizePaginationParams,
  normalizeParamArray,
} = require('../utils/query-normalizers');
const { sanitizeSortBy, sanitizeSortOrder } = require('../utils/sort-utils');

/**
 * Middleware to normalize query parameters for filtering, sorting, and pagination.
 *
 * Normalization steps:
 * - Trims all query keys and values
 * - Converts pagination fields (`page`, `limit`) to integers
 * - Sanitizes `sortBy` and `sortOrder` based on the provided module's allowed sort field map
 * - Normalizes specified keys into arrays (e.g., 'statusId', 'createdBy')
 * - Converts specified keys to booleans (e.g., 'onlyWithAddress')
 *
 * @param {string[]} arrayKeys - List of query keys to normalize as arrays (e.g., ['statusId', 'createdBy'])
 * @param {string[]} booleanKeys - List of query keys to normalize as booleans (e.g., ['onlyWithAddress'])
 * @param {string|null} moduleKey - Optional module key for sort mapping (e.g., 'orderTypeSortMap')
 * @returns {function} Express middleware
 */
const createQueryNormalizationMiddleware = (
  arrayKeys = [],
  booleanKeys = [],
  moduleKey = null
) => {
  return (req, res, next) => {
    const rawQuery = req.query ?? {};
    const trimmedQuery = normalizeFilterKeys(rawQuery);
    const { page, limit, sortOrder: rawSortOrder } = normalizePaginationParams(trimmedQuery);
    
    const rawSortBy = trimmedQuery.sortBy || '';
    const sanitizedSortBy = sanitizeSortBy(rawSortBy, moduleKey);
    const sanitizedSortOrder = sanitizeSortOrder(rawSortOrder);
    
    // Normalize array keys
    const normalizedArrays = {};
    for (const key of arrayKeys) {
      if (key in trimmedQuery) {
        const normalized = normalizeParamArray(trimmedQuery[key]);
        if (normalized !== undefined) {
          normalizedArrays[key] = normalized;
        }
      }
    }
    
    // Convert boolean keys
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
    
    req.normalizedQuery = {
      filters: {
        ...trimmedQuery,
        ...normalizedArrays,
        ...normalizedBooleans,
      },
      page,
      limit,
      sortBy: sanitizedSortBy,
      sortOrder: sanitizedSortOrder,
    };
    
    next();
  };
};

module.exports = createQueryNormalizationMiddleware;
