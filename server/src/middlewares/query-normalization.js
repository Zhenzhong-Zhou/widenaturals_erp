const {
  normalizeFilterKeys,
  normalizePaginationParams,
  normalizeParamArray,
} = require('../utils/query-normalizers');
const { sanitizeSortBy, sanitizeSortOrder } = require('../utils/sort-utils');

/**
 * Middleware to normalize query parameters for filtering, sorting, and pagination.
 *
 * - Trims all query keys
 * - Normalizes pagination (page, limit)
 * - Sanitizes sortBy and sortOrder based on module
 * - Normalizes specified keys into arrays
 *
 * @param {string[]} arrayKeys - List of query keys to normalize as arrays (e.g., ['statusId', 'createdBy'])
 * @param {string|null} moduleKey - Module key for sort mapping (e.g., 'orderType')
 * @returns {function} Express middleware
 */
const createQueryNormalizationMiddleware = (arrayKeys = [], moduleKey = null) => {
  return (req, res, next) => {
    const rawQuery = req.query ?? {};
    const trimmedQuery = normalizeFilterKeys(rawQuery);
    const { page, limit, sortOrder: rawSortOrder } = normalizePaginationParams(trimmedQuery);
    
    const rawSortBy = trimmedQuery.sortBy || '';
    const sanitizedSortBy = sanitizeSortBy(rawSortBy, moduleKey);
    const sanitizedSortOrder = sanitizeSortOrder(rawSortOrder);
    
    // Normalize specified array keys
    const normalizedArrays = {};
    for (const key of arrayKeys) {
      if (key in trimmedQuery) {
        const normalized = normalizeParamArray(trimmedQuery[key]);
        if (normalized !== undefined) {
          normalizedArrays[key] = normalized;
        }
      }
    }
    
    req.normalizedQuery = {
      filters: {
        ...trimmedQuery,
        ...normalizedArrays,
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
