/**
 * @file normalize-query.js
 * @description Middleware factory that normalises raw Express query parameters
 * into a typed, whitelisted, and consistently shaped `req.normalizedQuery`
 * object for use by service and repository layers.
 *
 * Required middleware order (GET / lookup routes):
 *   sanitizeInput (global) → validate(schema, 'query') → this middleware → controller
 *
 * This middleware reads from `req.validatedQuery`, which is written by the
 * `validate` middleware after Joi coercion and default application. It will
 * throw immediately at request time if `req.validatedQuery` is undefined,
 * which means `validate` did not run before it — a pipeline misconfiguration
 * that must be fixed at the route level.
 *
 * Pagination modes (controlled by factoryOptions.paginationMode):
 *   'page'   — page/limit style for table/list views.
 *              Returns: { page, limit, offset, sortOrder }
 *              offset is derived internally as (page - 1) * limit.
 *              Callers must not pass offset directly.
 *
 *   'offset' — offset/limit style for dropdown/lookup views.
 *              Returns: { offset, limit, sortOrder }
 *              page is not computed or returned — meaningless in offset mode.
 *
 * Default: 'page' — preserves backward compatibility with all existing routes.
 */

'use strict';

const Joi = require('joi');
const {
  normalizeFilterKeys,
  normalizePageParams,
  normalizeOffsetParams,
  normalizeParamArray,
  normalizeSortOrder,
} = require('../utils/query-normalizers');
const {
  sanitizeSortBy,
  getSortMapForModule,
} = require('../utils/query/sort-resolver');

// -----------------------------------------------------------------------------
// Module-level constants
// -----------------------------------------------------------------------------

/**
 * Query keys consumed by pagination/sorting logic that must never be injected
 * into the `filters` object, even if they appear in `filterKeysOrSchema`.
 *
 * @type {Set<string>}
 */
const RESERVED_KEYS = new Set(['page', 'limit', 'offset', 'sortBy', 'sortOrder']);

/**
 * Valid pagination mode values.
 * @type {Set<string>}
 */
const PAGINATION_MODES = new Set(['page', 'offset']);

// -----------------------------------------------------------------------------
// Private helpers
// -----------------------------------------------------------------------------

/**
 * Coerces a raw query value to a boolean.
 *
 * Truthy inputs : `true`, `'true'`, `1`, `'1'`.
 * Everything else (including absent values) becomes `false`.
 *
 * @param {unknown} val - Raw value from the query object.
 * @returns {boolean}
 */
const toBoolean = (val) =>
  val === true || val === 'true' || val === 1 || val === '1';

/**
 * Extracts filter key names from either a plain string array or a Joi schema.
 *
 * Supports two Joi schema shapes:
 *   - A bare object schema:  `Joi.object({ keyword: ..., statusId: ... })`
 *   - A full route schema with a nested filters key:
 *     `Joi.object({ filters: Joi.object({ ... }) })`
 *
 * @param {string[] | import('joi').Schema} input      - Allowed filter keys or a Joi schema.
 * @param {string}                          [nestedKey='filters']
 *   Nested key to inspect when `input` is a full route schema.
 * @returns {string[]} Resolved filter key names.
 * @throws {Error} If `input` is neither a string array nor a Joi object schema.
 */
const extractFilterKeys = (input, nestedKey = 'filters') => {
  if (Array.isArray(input)) return input;
  
  const isJoiSchema = typeof Joi?.isSchema === 'function' && Joi.isSchema(input);
  
  if (isJoiSchema) {
    const desc = input.describe?.();
    
    // Case A: input is the filters schema itself.
    if (desc?.type === 'object' && desc?.keys) {
      return Object.keys(desc.keys);
    }
    
    // Case B: input is a full route schema containing a nested filters object.
    const nested = desc?.keys?.[nestedKey]?.keys;
    if (nested) return Object.keys(nested);
  }
  
  const kind = Array.isArray(input) ? 'array' : typeof input;
  throw new Error(
    `Invalid filterKeysOrSchema: expected string[] or Joi object schema ` +
    `(optionally with nested "${nestedKey}"). Received: ${kind}.`
  );
};

/**
 * Normalizes pagination from trimmedQuery using the correct mode.
 *
 * 'page'   → normalizePageParams   → { page, limit, offset, sortOrder }
 * 'offset' → normalizeOffsetParams → { offset, limit, sortOrder }
 *            page is intentionally absent in offset mode — returning it would
 *            risk callers reading a value that is meaningless when offset is
 *            not a clean multiple of limit.
 *
 * @param {Object} trimmedQuery  - Trimmed query object.
 * @param {string} mode          - 'page' or 'offset'.
 * @returns {{ page?: number, limit: number, offset: number, sortOrder: string }}
 */
const resolvePaginationParams = (trimmedQuery, mode) => {
  if (mode === 'offset') return normalizeOffsetParams(trimmedQuery);
  return normalizePageParams(trimmedQuery);
};

// -----------------------------------------------------------------------------
// Middleware factory
// -----------------------------------------------------------------------------

/**
 * Creates an Express middleware that normalizes query parameters into a safe,
 * consistently shaped object attached to `req.normalizedQuery`.
 *
 * Must run AFTER `validate(schema, 'query')` in the middleware pipeline so
 * that Joi-coerced types and defaults are available on `req.validatedQuery`.
 *
 * Normalization pipeline (per request):
 *   1.  Read `req.validatedQuery` (fail fast if undefined).
 *   2.  Trim all query keys and string values.
 *   3.  Parse pagination via the selected mode (page or offset).
 *   4.  Sanitize sort fields via the module sort map.
 *   5.  Coerce `arrayKeys` values to arrays → placed in `filters`.
 *   6.  Coerce `booleanKeys` values to booleans → placed in `filters`.
 *   7.  Coerce `optionBooleanKeys` values to booleans → placed in `options`.
 *   8.  Coerce `optionStringKeys` values to trimmed strings → placed in `options`.
 *   9.  Whitelist and inject remaining allowed filter keys → placed in `filters`.
 *   10. Assemble and attach `req.normalizedQuery`.
 *
 * @param {string} [moduleKey='']
 *   Key used to look up the module-specific sort map via `getSortMapForModule`.
 *
 * @param {string[]} [arrayKeys=[]]
 *   Query keys whose values are coerced to arrays and placed in `filters`.
 *
 * @param {string[]} [booleanKeys=[]]
 *   Query keys coerced to booleans and placed in `filters`.
 *
 * @param {string[] | import('joi').Schema} filterKeysOrSchema
 *   Whitelist of allowed filter keys (plain array or Joi schema).
 *
 * @param {object}  [factoryOptions={}]
 * @param {boolean} [factoryOptions.includePagination=true]  Attach pagination fields.
 * @param {boolean} [factoryOptions.includeSorting=true]     Attach sorting fields.
 * @param {'page'|'offset'} [factoryOptions.paginationMode='page']
 *   Controls which pagination normalizer is used.
 *   'page'   — table/list views:    page + limit → offset derived internally.
 *   'offset' — dropdown/lookup views: offset + limit → page not returned.
 *
 * @param {string[]} [optionBooleanKeys=[]]
 *   Query keys coerced to booleans and placed in `options`.
 *
 * @param {string[]} [optionStringKeys=[]]
 *   Query keys coerced to trimmed strings and placed in `options`.
 *
 * @returns {import('express').RequestHandler}
 *
 * @throws {Error} At factory time if `filterKeysOrSchema` is invalid.
 * @throws {Error} At factory time if `paginationMode` is not 'page' or 'offset'.
 * @throws {Error} At request time if `req.validatedQuery` is undefined.
 *
 * @example
 * // Table / list view — page-based (default)
 * createQueryNormalizationMiddleware(
 *   'skus',
 *   ['statusId'],
 *   [],
 *   ['keyword', 'statusId'],
 *   { includePagination: true, includeSorting: true, paginationMode: 'page' }
 * )
 * // req.normalizedQuery => { filters, options, page, limit, offset, sortBy, sortOrder }
 *
 * @example
 * // Dropdown / lookup view — offset-based
 * createQueryNormalizationMiddleware(
 *   'skus',
 *   [],
 *   [],
 *   ['keyword'],
 *   { includePagination: true, includeSorting: false, paginationMode: 'offset' }
 * )
 * // req.normalizedQuery => { filters, options, offset, limit }
 * // page is intentionally absent — meaningless in offset mode
 */
const createQueryNormalizationMiddleware = (
  moduleKey          = '',
  arrayKeys          = [],
  booleanKeys        = [],
  filterKeysOrSchema = [],
  factoryOptions     = {},
  optionBooleanKeys  = [],
  optionStringKeys   = []
) => {
  // Resolve factory options once — not per request.
  const resolvedOptions = {
    includePagination: true,
    includeSorting:    true,
    paginationMode:    'page',   // default preserves backward compatibility
    ...factoryOptions,
  };
  
  // Fail fast at factory time — misconfigured mode is caught at startup,
  // not silently on the first request.
  if (!PAGINATION_MODES.has(resolvedOptions.paginationMode)) {
    throw new Error(
      `[createQueryNormalizationMiddleware] Invalid paginationMode: ` +
      `"${resolvedOptions.paginationMode}". Must be "page" or "offset".`
    );
  }
  
  // Extract and validate filter keys once at factory time — not per request.
  const filterKeys = extractFilterKeys(filterKeysOrSchema);
  
  // Return the per-request middleware.
  return (req, _res, next) => {
    
    // -------------------------------------------------------------------------
    // 1. Read req.validatedQuery — fail fast if absent (pipeline misconfiguration)
    // -------------------------------------------------------------------------
    if (!req.validatedQuery) {
      return next(
        new Error(
          '[createQueryNormalizationMiddleware] req.validatedQuery is undefined. ' +
          'Ensure validate(schema, "query") runs before this middleware in the pipeline.'
        )
      );
    }
    
    const rawQuery = req.validatedQuery;
    
    // -------------------------------------------------------------------------
    // 2. Trim all query keys and string values
    // -------------------------------------------------------------------------
    const trimmedQuery = normalizeFilterKeys(rawQuery);
    
    // -------------------------------------------------------------------------
    // 3. Pagination — mode selected at factory time, not per request
    //    'page'   → normalizePageParams   → { page, limit, offset, sortOrder }
    //    'offset' → normalizeOffsetParams → { offset, limit, sortOrder }
    // -------------------------------------------------------------------------
    const {
      page,             // present in 'page' mode, undefined in 'offset' mode
      limit,
      offset,
      sortOrder: rawSortOrder,
    } = resolvePaginationParams(trimmedQuery, resolvedOptions.paginationMode);
    
    // -------------------------------------------------------------------------
    // 4. Sorting
    // -------------------------------------------------------------------------
    const sortMap            = getSortMapForModule(moduleKey);
    const sanitizedSortBy    =
      sanitizeSortBy(trimmedQuery.sortBy, moduleKey) ?? sortMap?.defaultNaturalSort;
    const sanitizedSortOrder = normalizeSortOrder(rawSortOrder);
    
    // -------------------------------------------------------------------------
    // 5. Array keys → filters
    // -------------------------------------------------------------------------
    const normalizedArrays = {};
    for (const key of arrayKeys) {
      if (trimmedQuery[key] != null) {
        const result = normalizeParamArray(trimmedQuery[key]);
        if (result.length > 0) normalizedArrays[key] = result;
      }
    }
    
    // -------------------------------------------------------------------------
    // 6. Boolean keys → filters
    // -------------------------------------------------------------------------
    const normalizedBooleans = {};
    for (const key of booleanKeys) {
      if (trimmedQuery[key] != null) {
        normalizedBooleans[key] = toBoolean(trimmedQuery[key]);
      }
    }
    
    // -------------------------------------------------------------------------
    // 7. Boolean keys → options
    // -------------------------------------------------------------------------
    const normalizedOptionBooleans = {};
    for (const key of optionBooleanKeys) {
      if (trimmedQuery[key] != null) {
        normalizedOptionBooleans[key] = toBoolean(trimmedQuery[key]);
      }
    }
    
    // -------------------------------------------------------------------------
    // 8. String keys → options
    // -------------------------------------------------------------------------
    const normalizedOptionStrings = {};
    for (const key of optionStringKeys) {
      if (trimmedQuery[key] != null) {
        normalizedOptionStrings[key] = String(trimmedQuery[key]).trim();
      }
    }
    
    // -------------------------------------------------------------------------
    // 9. Whitelisted plain filter keys
    //    Reserved keys are always excluded even if listed in filterKeysOrSchema.
    // -------------------------------------------------------------------------
    const filters = {};
    for (const key of filterKeys) {
      if (!RESERVED_KEYS.has(key) && trimmedQuery[key] !== undefined) {
        filters[key] = trimmedQuery[key];
      }
    }
    
    // -------------------------------------------------------------------------
    // 10. Assemble req.normalizedQuery
    //     page is spread conditionally — it is undefined in 'offset' mode and
    //     must not appear in the output to prevent callers reading a wrong value.
    // -------------------------------------------------------------------------
    req.normalizedQuery = {
      filters: {
        ...filters,
        ...normalizedArrays,
        ...normalizedBooleans,
      },
      options: {
        ...normalizedOptionBooleans,
        ...normalizedOptionStrings,
      },
      ...(resolvedOptions.includePagination && {
        limit,
        offset,
        // page is only attached in 'page' mode — absent in 'offset' mode so
        // callers cannot accidentally read a stale or derived value.
        ...(resolvedOptions.paginationMode === 'page' && { page }),
      }),
      ...(resolvedOptions.includeSorting && {
        sortBy:    sanitizedSortBy,
        sortOrder: sanitizedSortOrder,
      }),
    };
    
    next();
  };
};

module.exports = createQueryNormalizationMiddleware;
