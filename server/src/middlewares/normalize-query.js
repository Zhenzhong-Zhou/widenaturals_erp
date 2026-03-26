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
 */

'use strict';

const Joi = require('joi');
const {
  normalizeFilterKeys,
  normalizePaginationParams,
  normalizeParamArray,
  normalizeSortOrder,
} = require('../utils/query-normalizers');
const {
  sanitizeSortBy,
  getSortMapForModule,
} = require('../utils/sort-utils');

// -----------------------------------------------------------------------------
// Module-level constants
// Defined here so they are not reallocated on every request.
// -----------------------------------------------------------------------------

/**
 * Query keys consumed by pagination/sorting logic that must never be injected
 * into the `filters` object, even if they appear in `filterKeysOrSchema`.
 *
 * @type {Set<string>}
 */
const RESERVED_KEYS = new Set(['page', 'limit', 'offset', 'sortBy', 'sortOrder']);

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

// -----------------------------------------------------------------------------
// Middleware factory
// -----------------------------------------------------------------------------

/**
 * Creates an Express middleware that normalizes query parameters into a safe,
 * consistently shaped object attached to `req.normalizedQuery`.
 *
 * Must run AFTER `validate(schema, 'query')` in the middleware pipeline so
 * that Joi-coerced types and defaults (e.g. offset → number, limit → 50) are
 * available on `req.validatedQuery`. If `req.validatedQuery` is absent when
 * the returned middleware executes, it throws immediately to surface the
 * misconfigured pipeline.
 *
 * Normalization pipeline (per request):
 *   1.  Read `req.validatedQuery` (fail fast if undefined).
 *   2.  Trim all query keys and string values.
 *   3.  Parse pagination (`page`, `limit`, `offset`) via `normalizePaginationParams`.
 *   4.  Sanitize sort fields (`sortBy`, `sortOrder`) via the module sort map.
 *   5.  Coerce `arrayKeys` values to arrays → placed in `filters`.
 *   6.  Coerce `booleanKeys` values to booleans → placed in `filters`.
 *   7.  Coerce `optionBooleanKeys` values to booleans → placed in `options`.
 *   8.  Coerce `optionStringKeys` values to trimmed strings → placed in `options`.
 *   9.  Whitelist and inject remaining allowed filter keys → placed in `filters`.
 *   10. Assemble and attach `req.normalizedQuery`.
 *
 * Reserved keys (`page`, `limit`, `offset`, `sortBy`, `sortOrder`) are always
 * excluded from `filters` regardless of what appears in `filterKeysOrSchema`.
 *
 * @param {string} [moduleKey='']
 *   Key used to look up the module-specific sort map via `getSortMapForModule`.
 *   Examples: `'packagingMaterials'`, `'customers'`.
 *
 * @param {string[]} [arrayKeys=[]]
 *   Query keys whose values are coerced to arrays and placed in `filters`.
 *   Examples: `['statusId', 'createdBy']`.
 *
 * @param {string[]} [booleanKeys=[]]
 *   Query keys coerced to booleans and placed in `filters`.
 *   Truthy inputs: `true`, `'true'`, `1`, `'1'`. All else → `false`.
 *
 * @param {string[] | import('joi').Schema} filterKeysOrSchema
 *   Whitelist of allowed filter keys (plain array or Joi schema).
 *   Only matching query params are placed in `filters`.
 *
 * @param {object}  [factoryOptions={}]                     Factory-level behaviour toggles.
 * @param {boolean} [factoryOptions.includePagination=true] Attach `limit`, `offset`, `page`.
 * @param {boolean} [factoryOptions.includeSorting=true]    Attach `sortBy`, `sortOrder`.
 *
 * @param {string[]} [optionBooleanKeys=[]]
 *   Query keys coerced to booleans and placed in `options`.
 *   Use for feature-flag knobs. Examples: `['includeBarcode', 'visibleOnly']`.
 *
 * @param {string[]} [optionStringKeys=[]]
 *   Query keys coerced to trimmed strings and placed in `options`.
 *   Use for mode or region toggles. Examples: `['mode', 'region']`.
 *
 * @returns {import('express').RequestHandler}
 *   Middleware that sets `req.normalizedQuery` to:
 *   ```js
 *   {
 *     filters:   { ...whitelistedKeys, ...arrays, ...booleans },
 *     options:   { ...optionBooleans, ...optionStrings },
 *     // if includePagination:
 *     limit, offset, page,
 *     // if includeSorting:
 *     sortBy, sortOrder,
 *   }
 *   ```
 *
 * @throws {Error} At factory time if `filterKeysOrSchema` is invalid.
 * @throws {Error} At request time if `req.validatedQuery` is undefined
 *   (indicates `validate` middleware did not run before this middleware).
 *
 * @example
 * // Correct pipeline — validate runs first so req.validatedQuery is populated.
 * router.get(
 *   '/packaging-materials',
 *   validate(pmQuerySchema, 'query'),
 *   createQueryNormalizationMiddleware(
 *     'packagingMaterials',
 *     ['statusId', 'createdBy'],   // arrayKeys
 *     ['onlyWithAddress'],          // booleanKeys
 *     ['keyword', 'statusId', 'createdBy', 'onlyWithAddress'], // filterKeys
 *     { includePagination: true, includeSorting: true },
 *     ['includeBarcode', 'visibleOnly'], // optionBooleanKeys
 *     ['mode']                           // optionStringKeys
 *   ),
 *   listPackagingMaterialsHandler
 * );
 *
 * // Query string:  ?keyword= box &statusId=1&statusId=2&onlyWithAddress=true
 * //               &includeBarcode=1&mode=salesDropdown&limit=25&offset=50
 * // req.normalizedQuery =>
 * // {
 * //   filters: { keyword: 'box', statusId: ['1','2'], onlyWithAddress: true },
 * //   options: { includeBarcode: true, mode: 'salesDropdown' },
 * //   limit: 25, offset: 50, page: 2,
 * //   sortBy: 'name', sortOrder: 'ASC'
 * // }
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
    ...factoryOptions,
  };
  
  // Extract and validate filter keys once at factory time — not per request.
  const filterKeys = extractFilterKeys(filterKeysOrSchema);
  
  // Return the per-request middleware.
  return (req, _res, next) => {
    
    // -------------------------------------------------------------------------
    // 1. Read req.validatedQuery (written by validate middleware after Joi
    //    coercion). Fail fast if it is absent — that means validate did not run
    //    before this middleware, which is a pipeline misconfiguration.
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
    // 3. Pagination
    //    At this point limit/offset are already numbers (Joi coerced them).
    //    normalizePaginationParams handles any remaining edge cases.
    // -------------------------------------------------------------------------
    const {
      page,
      limit,
      offset,
      sortOrder: rawSortOrder,
    } = normalizePaginationParams(trimmedQuery);
    
    // -------------------------------------------------------------------------
    // 4. Sorting
    //    sortBy falls back to the module's default natural sort when absent
    //    or when the raw value fails sanitization.
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
      ...(resolvedOptions.includePagination && { limit, offset, page }),
      ...(resolvedOptions.includeSorting && {
        sortBy:    sanitizedSortBy,
        sortOrder: sanitizedSortOrder,
      }),
    };
    
    next();
  };
};

module.exports = createQueryNormalizationMiddleware;
