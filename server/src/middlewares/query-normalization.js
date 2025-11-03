const Joi = require('joi');
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
 * Extract filter keys from either:
 *  - an array of strings, or
 *  - a Joi schema (object schema directly or a route schema with a nested `{ filters: object() }`)
 *
 * @param {string[]|import('joi').Schema} input
 * @param {string} [nestedKey='filters'] - key to read when schema is a full route schema
 * @returns {string[]} filter keys
 * @throws {Error} when input is neither an array nor a Joi schema with object keys
 */
const extractFilterKeys = (input, nestedKey = 'filters') => {
  if (Array.isArray(input)) return input;

  // Robust Joi detection (supports different Joi versions)
  const isJoiSchema =
    typeof Joi?.isSchema === 'function' && Joi.isSchema(input);
  if (isJoiSchema) {
    const desc = input.describe?.();
    // Case A: input itself is the filters object schema
    if (desc?.type === 'object' && desc?.keys) {
      return Object.keys(desc.keys);
    }
    // Case B: input is a full route schema with nested { filters: object() }
    const nested = desc?.keys?.[nestedKey]?.keys;
    if (nested) return Object.keys(nested);
  }

  const kind = Array.isArray(input) ? 'array' : typeof input;
  throw new Error(
    `Invalid filterKeysOrSchema: expected string[] or Joi object schema (optionally with nested "${nestedKey}"). Received ${kind}.`
  );
};

/**
 * Creates an Express middleware that normalizes query parameters into a safe,
 * consistent shape for filtering, sorting, and pagination.
 *
 * Normalization pipeline:
 *  1) Trims all query keys/values.
 *  2) Parses pagination (`page`, `limit`) and keeps `offset` (defaults to 0 if absent).
 *  3) Sanitizes sorting using the module's sort map (`getSortMapForModule(moduleKey)`):
 *     - `sortBy` is validated via `sanitizeSortBy`; falls back to `sortMap.defaultNaturalSort` if invalid/absent.
 *     - `sortOrder` is normalized via `sanitizeSortOrder`.
 *  4) Normalizes selected query keys to arrays (e.g., `statusId`, `createdBy`) via `normalizeParamArray`.
 *  5) Converts selected query keys to booleans into `filters` (e.g., `onlyWithAddress`).
 *  6) Converts selected query keys to booleans/strings into `options` (feature flags or mode toggles).
 *  7) Whitelists and injects only allowed filter keys (array of keys or a Joi schema).
 *  8) Attaches the normalized payload to `req.normalizedQuery`:
 *     {
 *       filters: { ... },
 *       options: { ... },
 *       // optionally (if enabled via options):
 *       page, limit, offset, sortBy, sortOrder
 *     }
 *
 * Reserved query keys are ignored for filter injection: `page`, `limit`, `offset`, `sortBy`, `sortOrder`.
 *
 * @param {string} [moduleKey=''] - Key used to lookup the module-specific sort map
 *   (e.g., 'packagingMaterials', 'customers'). Passed to `getSortMapForModule(moduleKey)`.
 *
 * @param {string[]} [arrayKeys=[]] - Query keys to coerce into arrays and include under `filters`.
 *   Examples: ['statusId', 'createdBy']
 *
 * @param {string[]} [booleanKeys=[]] - Query keys to coerce into booleans and include under `filters`.
 *   Truthy values: true, 'true', 1, '1'. Everything else becomes false.
 *
 * @param {string[]|object} filterKeysOrSchema - Either:
 *   - An array of allowed filter keys to copy from the query into `filters`, or
 *   - A Joi schema object; keys are derived from `schema.describe().keys`.
 *   (Used to whitelist which query params become `filters`.)
 *
 * @param {object} [options={}] - Factory options.
 * @param {boolean} [options.includePagination=true] - If true, include `limit`, `offset`, and `page` on `req.normalizedQuery`.
 * @param {boolean} [options.includeSorting=true] - If true, include `sortBy` and `sortOrder` on `req.normalizedQuery`.
 *
 * @param {string[]} [optionBooleanKeys=[]] - Query keys to coerce into booleans and include under `options`.
 *   Use this for knob-like feature flags (e.g., ['includeBarcode', 'visibleOnly']).
 *
 * @param {string[]} [optionStringKeys=[]] - Query keys to coerce into trimmed strings and include under `options`.
 *   Use this for small mode or string flags (e.g., ['mode', 'region']).
 *
 * @returns {(req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void}
 *   Express middleware that sets `req.normalizedQuery = { filters, options, [page], [limit], [offset], [sortBy], [sortOrder] }`.
 *
 * @throws {Error} If `filterKeysOrSchema` is neither an array nor a Joi-like schema (`.describe()` present).
 *
 * @example
 * // Route wiring
 * const normalizePM = createQueryNormalizationMiddleware(
 *   'packagingMaterials',            // moduleKey
 *   ['statusId', 'createdBy'],       // arrayKeys -> filters
 *   ['onlyWithAddress'],             // booleanKeys -> filters
 *   ['keyword', 'statusId', 'createdBy', 'onlyWithAddress'], // allowed filter keys
 *   { includePagination: true, includeSorting: true },       // options
 *   ['includeBarcode', 'visibleOnly'], // optionBooleanKeys -> options
 *   ['mode']                           // optionStringKeys -> options
 * );
 *
 * app.get('/api/packaging-materials', normalizePM, (req, res) => {
 *   // Example input:
 *   //   ?keyword= box &statusId=1&statusId=2&onlyWithAddress=true&includeBarcode=1&mode=salesDropdown&limit=25&offset=50&sortBy=name&sortOrder=ASC
 *   //
 *   // req.normalizedQuery =>
 *   // {
 *   //   filters: {
 *   //     keyword: 'box',
 *   //     statusId: ['1', '2'],
 *   //     onlyWithAddress: true
 *   //   },
 *   //   options: {
 *   //     includeBarcode: true,
 *   //     mode: 'salesDropdown'
 *   //   },
 *   //   limit: 25,
 *   //   offset: 50,
 *   //   page: 2,              // if your normalizePaginationParams computes page from offset/limit
 *   //   sortBy: 'name',       // sanitized via module sort map (or defaultNaturalSort if invalid/empty)
 *   //   sortOrder: 'ASC'
 *   // }
 *   service(req.normalizedQuery).then(res.json).catch(next);
 * });
 */
const createQueryNormalizationMiddleware = (
  moduleKey = '',
  arrayKeys = [],
  booleanKeys = [],
  filterKeysOrSchema = [],
  options = {},
  optionBooleanKeys = [],
  optionStringKeys = []
) => {
  const finalOptions = {
    includePagination: true,
    includeSorting: true,
    ...options,
  };

  let filterKeys = extractFilterKeys(filterKeysOrSchema);

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

    // 5c. Option-level strings
    const normalizedOptionStrings = {};
    for (const key of optionStringKeys) {
      if (trimmedQuery[key] != null) {
        normalizedOptionStrings[key] = String(trimmedQuery[key]).trim();
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
        ...normalizedOptionStrings,
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
