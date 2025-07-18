const {
  normalizeFilterKeys,
  normalizePaginationParams,
  normalizeParamArray,
} = require('../utils/query-normalizers');

const {
  sanitizeSortBy,
  sanitizeSortOrder,
  getSortMapForModule,
} = require('../utils/sort-utils');

/**
 * Middleware to normalize query parameters for filtering, sorting, and pagination.
 *
 * Normalization steps:
 * - Trims all query keys and values
 * - Converts pagination fields (`page`, `limit`) to integers
 * - Sanitizes `sortBy` and `sortOrder` using module's sort map
 * - Normalizes specified keys into arrays (e.g., ['statusId', 'createdBy'])
 * - Converts specified keys to booleans (e.g., ['onlyWithAddress'])
 * - Injects only whitelisted filter keys into `filters` object
 * - Optionally includes pagination and sorting fields
 *
 * @param {string|null} moduleKey - Optional sort map key (e.g., 'orderTypeSortMap')
 * @param {string[]} arrayKeys - Query keys to normalize as arrays
 * @param {string[]} booleanKeys - Query keys to normalize as booleans
 * @param {string[]|object} filterKeysOrSchema - Explicit filter keys or Joi schema
 * @param {object} [options] - Optional config
 * @param {boolean} [options.includePagination=true] - Include pagination fields
 * @param {boolean} [options.includeSorting=true] - Include sorting fields
 *
 * @returns {function} Express middleware that sets `req.normalizedQuery`
 */
const createQueryNormalizationMiddleware = (
  moduleKey = '',
  arrayKeys = [],
  booleanKeys = [],
  filterKeysOrSchema = [],
  options = {}
) => {
  const finalOptions = {
    includePagination: true,
    includeSorting: true,
    ...options,
  };

  let filterKeys = [];

  if (Array.isArray(filterKeysOrSchema)) {
    filterKeys = filterKeysOrSchema;
  } else if (filterKeysOrSchema?.describe) {
    filterKeys = Object.keys(filterKeysOrSchema.describe().keys);
  } else {
    throw new Error(
      'filterKeysOrSchema must be an array of strings or a Joi schema object'
    );
  }

  return (req, res, next) => {
    const rawQuery = req.query ?? {};

    // 1. Trim all keys/values
    const trimmedQuery = normalizeFilterKeys(rawQuery);

    // 2. Normalize pagination
    const {
      page,
      limit,
      sortOrder: rawSortOrder,
    } = normalizePaginationParams(trimmedQuery);

    // 3. Sanitize sorting
    const sortMap = getSortMapForModule(moduleKey);
    const rawSortBy = trimmedQuery.sortBy;
    const sanitizedSortBy =
      sanitizeSortBy(rawSortBy, moduleKey) ?? sortMap?.defaultNaturalSort;
    const sanitizedSortOrder = sanitizeSortOrder(rawSortOrder);

    // 4. Normalize arrays
    const normalizedArrays = {};
    for (const key of arrayKeys) {
      if (trimmedQuery[key] != null) {
        const result = normalizeParamArray(trimmedQuery[key]);
        if (result.length > 0) normalizedArrays[key] = result;
      }
    }

    // 5. Normalize booleans
    const normalizedBooleans = {};
    for (const key of booleanKeys) {
      if (trimmedQuery[key] != null) {
        const val = trimmedQuery[key];
        normalizedBooleans[key] =
          val === true || val === 'true' || val === '1' || val === 1;
      }
    }

    // 6. Filter plain fields
    const reservedKeys = new Set([
      'page',
      'limit',
      'offset',
      'sortBy',
      'sortOrder',
    ]);
    const filters = {};
    for (const key of filterKeys) {
      if (!reservedKeys.has(key) && trimmedQuery[key] !== undefined) {
        filters[key] = trimmedQuery[key];
      }
    }

    // 7. Assemble final object
    const normalized = {
      filters: {
        ...filters,
        ...normalizedArrays,
        ...normalizedBooleans,
      },
    };

    // 8. Add pagination
    if (finalOptions.includePagination) {
      normalized.limit = limit;
      normalized.offset = Number(trimmedQuery.offset ?? 0);
      if (page !== undefined) normalized.page = page;
    }

    // 9. Add sorting
    if (finalOptions.includeSorting) {
      normalized.sortBy = sanitizedSortBy;
      normalized.sortOrder = sanitizedSortOrder;
    }

    // 10. Attach to request
    req.normalizedQuery = normalized;

    next();
  };
};

module.exports = createQueryNormalizationMiddleware;
