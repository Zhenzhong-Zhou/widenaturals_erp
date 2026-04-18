/**
 * @file sort-resolver.js
 * @description
 * Resolves and sanitizes client-facing sort parameters into SQL column
 * configurations for use in paginated queries.
 *
 * Pure module — no DB access, no async, no side effects beyond warn logging.
 * Sits between the HTTP layer (query-normalizers.js) and the SQL layer
 * (sql-ident.js / query-builder.js).
 *
 * Exports:
 * - getSortMapForModule — looks up the sort map for a registered module key
 * - sanitizeSortBy     — maps a raw sortBy string to a resolved SQL column string
 * - resolveSort        — maps a single sort key + direction to a full sort config object
 */

'use strict';

const AppError = require('../AppError');
const { SORTABLE_FIELDS } = require('../sort-field-mapping');
const { normalizeParamArray } = require('../query-normalizers');
const { logSystemWarn } = require('../logging/system-logger');

const CONTEXT = 'sort-resolver';

// ------------------------------------------------------------
// Internal helpers
// ------------------------------------------------------------

/**
 * Returns the sort map registered under `moduleKey`.
 *
 * Throws immediately on an unrecognized key so misconfigured call sites
 * surface as hard errors rather than silently producing empty results.
 *
 * @param {string} moduleKey - Registry key identifying the module (e.g. `'orders'`).
 * @returns {Record<string, string>} Map of request-facing sort key → SQL column.
 * @throws {AppError} If `moduleKey` is not registered in `SORTABLE_FIELDS`.
 */
const getSortMapForModule = (moduleKey) => {
  const sortMap = SORTABLE_FIELDS[moduleKey];

  if (!sortMap || typeof sortMap !== 'object') {
    throw AppError.validationError(
      `Invalid or unregistered sort module key: "${moduleKey}"`,
      {
        context: `${CONTEXT}/getSortMapForModule`,
        meta: { moduleKey },
      }
    );
  }

  return sortMap;
};

// ------------------------------------------------------------
// Exports
// ------------------------------------------------------------

/**
 * Validates and sanitizes a raw `sortBy` request value against a module's sort map.
 *
 * Accepts a comma-separated string or array of sort keys, validates each against
 * the module's sort map, warns on unrecognized keys, and returns the valid camelCase
 * keys joined with `, `.
 *
 * Falls back to `'defaultNaturalSort'` when no requested keys are valid.
 * Returns `null` if neither the request keys nor the default resolve — the
 * query builder is responsible for handling a null result.
 *
 * Note: This function returns camelCase sort map keys, NOT resolved SQL columns.
 * SQL resolution is the responsibility of `resolveSort`.
 *
 * @param {string|string[]} sortByRaw          - Raw sortBy value from the request.
 * @param {string|null}     [moduleKey=null]   - Registry key for the sort map.
 * @param {string|null}     [defaultSort=null] - Fallback camelCase key when no keys resolve.
 * @returns {string|null} Valid camelCase sort key(s), or `defaultSort` if nothing matched.
 * @throws {AppError} If `moduleKey` is not registered.
 *
 * @example
 * sanitizeSortBy('brand', 'products')
 * // → 'brand' (valid key in the products sort map)
 *
 * @example
 * sanitizeSortBy('unknown', 'products')
 * // → null (warns on 'unknown', no fallback provided)
 */
const sanitizeSortBy = (
  sortByRaw = '',
  moduleKey = null,
  defaultSort = null
) => {
  const sortMap = getSortMapForModule(moduleKey);
  const requestedKeys = normalizeParamArray(sortByRaw) ?? [];

  const validKeys = requestedKeys.filter((key) => {
    const isValid = key in sortMap;
    if (!isValid) {
      logSystemWarn(`Unmapped sortBy key: "${key}"`, {
        context: `${CONTEXT}/sanitizeSortBy`,
        meta: { key, moduleKey },
      });
    }
    return isValid;
  });

  if (validKeys.length > 0) {
    return validKeys.join(', ');
  }

  return defaultSort ?? null;
};

/**
 * Resolves a single request-level sort key and direction into a sort
 * configuration object ready for the query builder.
 *
 * Looks up `sortBy` in the sort map registered under `moduleKey`. If the
 * key is unmapped, falls back to `defaultSort`. Supports multi-column
 * fallback sorting via an array `defaultSort` — the first element becomes
 * the primary sort, remaining elements become `additionalSorts` for
 * deterministic tie-breaking.
 *
 * @param {object}               options
 * @param {string}               options.sortBy              - Request-level sort key (e.g. `'createdAt'`).
 * @param {'ASC'|'DESC'}         [options.sortOrder='ASC']   - Sort direction.
 * @param {string}               options.moduleKey           - Key identifying the sort map.
 * @param {string|string[]|null} [options.defaultSort=null]  - Fallback DB column(s) when sortBy
 *   is unmapped. Must be fully qualified (e.g. `'a.created_at'`).
 * @returns {{
 *   sortBy:          string,
 *   sortOrder:       'ASC'|'DESC',
 *   additionalSorts: Array<{ column: string, direction: string }>
 * }}
 * @throws {AppError} If `moduleKey` is unregistered or `sortBy` is unmapped with no fallback.
 *
 * @example
 * resolveSort({ sortBy: 'createdAt', sortOrder: 'DESC', moduleKey: 'orders', defaultSort: 'o.created_at' })
 * // → { sortBy: 'o.created_at', sortOrder: 'DESC', additionalSorts: [] }
 *
 * @example
 * resolveSort({ sortBy: 'unknown', moduleKey: 'orders', defaultSort: ['o.created_at', 'o.id'] })
 * // → { sortBy: 'o.created_at', sortOrder: 'ASC', additionalSorts: [{ column: 'o.id', direction: 'ASC' }] }
 */
const resolveSort = ({
                       sortBy,
                       sortOrder = 'ASC',
                       moduleKey,
                       defaultSort = null,
                     }) => {
  // getSortMapForModule throws on unrecognized moduleKey — no need to re-check here.
  const sortMap = getSortMapForModule(moduleKey);
  
  const normalizedOrder =
    String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

  // Resolve the request key to a DB column via the sort map.
  const resolved = sortMap[sortBy];
  
  if (resolved) {
    return {
      sortBy: resolved,
      sortOrder: normalizedOrder,
      additionalSorts: [],
    };
  }

  // sortBy was unmapped — fall back to defaultSort.
  // defaultSort must be fully qualified (e.g. 'a.created_at') to avoid
  // column ambiguity in aliased multi-table queries.
  const fallbackSorts = Array.isArray(defaultSort)
    ? defaultSort
    : [defaultSort].filter(Boolean);
  
  if (!fallbackSorts.length) {
    throw AppError.validationError(
      `Unmapped sortBy key with no fallback: "${sortBy}"`,
      {
        context: `${CONTEXT}/resolveSort`,
        meta: { sortBy, moduleKey },
      }
    );
  }
  
  const [primary, ...rest] = fallbackSorts;
  
  return {
    sortBy: primary,
    sortOrder: normalizedOrder,
    // Additional columns provide deterministic tie-breaking for multi-column sorts.
    additionalSorts: rest.map((col) => ({
      column: col,
      direction: 'ASC',
    })),
  };
};

module.exports = {
  getSortMapForModule,
  sanitizeSortBy,
  resolveSort,
};
