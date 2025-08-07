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
 * - Converts specified keys to booleans in `filters` (e.g., ['onlyWithAddress'])
 * - Converts specified option-level booleans into `options` (e.g., ['includeBarcode'])
 * - Injects only whitelisted filter keys into the `filters` object
 * - Optionally includes pagination and sorting fields
 *
 * @param {string|null} moduleKey - Optional sort map key (e.g., 'orderTypeSortMap')
 * @param {string[]} arrayKeys - Query keys to normalize as arrays (added to `filters`)
 * @param {string[]} booleanKeys - Query keys to normalize as booleans (added to `filters`)
 * @param {string[]|object} filterKeysOrSchema - Explicit filter keys or Joi schema (used for `filters`)
 * @param {object} [options] - Optional config
 * @param {boolean} [options.includePagination=true] - Whether to include `limit`, `offset`, and `page`
 * @param {boolean} [options.includeSorting=true] - Whether to include `sortBy` and `sortOrder`
 * @param {string[]} [optionBooleanKeys=[]] - Query keys to normalize as booleans (added to `options`)
 *
 * @returns {function} Express middleware that sets `req.normalizedQuery = { filters, options, ...pagination }`
 */
const createQueryNormalizationMiddleware = (
  moduleKey = '',
  arrayKeys = [],
  booleanKeys = [],
  filterKeysOrSchema = [],
  options = {},
  optionBooleanKeys = [],
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
    
    // 5a. Filter-level booleans
    const normalizedBooleans = {};
    for (const key of booleanKeys) {
      if (trimmedQuery[key] != null) {
        const val = trimmedQuery[key];
        normalizedBooleans[key] =
          val === true || val === 'true' || val === '1' || val === 1;
      }
    }
    
    // 5b. Option-level booleans
    const normalizedOptionBooleans = {};
    for (const key of optionBooleanKeys) {
      if (trimmedQuery[key] != null) {
        const val = trimmedQuery[key];
        normalizedOptionBooleans[key] =
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

    // 7. Assemble a final object
    const normalized = {
      filters: {
        ...filters,
        ...normalizedArrays,
        ...normalizedBooleans,
      },
      options: {
        ...normalizedOptionBooleans,
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
