/**
 * @file sort-resolver.js
 * @description Resolves a validated sort key and direction into a DB column
 * sort configuration for use in paginated queries.
 *
 * Pure function — no DB access, no logging, no async.
 * Callers are responsible for passing a valid moduleKey registered in sort-utils.
 *
 * Exports:
 *  - resolveSort
 */

'use strict';

const AppError = require('../AppError');
const { getSortMapForModule } = require('../sort-utils');

// ─── Sort Resolver ────────────────────────────────────────────────────────────

/**
 * Resolves a request-level sort key into a DB column sort configuration.
 *
 * Looks up `sortBy` in the sort map registered under `moduleKey`. If the key
 * is not found, falls back to `defaultSort`. Supports multi-column fallback
 * sorting via an array `defaultSort`.
 *
 * @param {Object}          options
 * @param {string}          options.sortBy          - Request-level sort key (e.g. 'createdAt').
 * @param {'ASC'|'DESC'}    [options.sortOrder='ASC'] - Sort direction.
 * @param {string}          options.moduleKey        - Key identifying the sort map (e.g. 'addressSortMap').
 * @param {string|string[]} [options.defaultSort]    - Fallback DB column(s) when sortBy is unmapped.
 *                                                     Must be fully qualified (e.g. 'a.created_at').
 *
 * @returns {{
 *   sortBy:          string,
 *   sortOrder:       'ASC'|'DESC',
 *   additionalSorts: Array<{ column: string, direction: string }>
 * }} Resolved sort configuration ready for the query builder.
 *
 * @throws {AppError} If moduleKey does not resolve to a valid sort map.
 */
const resolveSort = ({
                       sortBy,
                       sortOrder    = 'ASC',
                       moduleKey,
                       defaultSort  = null,
                     }) => {
  const sortMap = getSortMapForModule(moduleKey);
  
  if (!sortMap || typeof sortMap !== 'object') {
    throw AppError.validationError(`Invalid sortMap for moduleKey: ${moduleKey}`, {
      context: 'sort-resolver/resolveSort',
      meta:    { moduleKey },
    });
  }
  
  const normalizedOrder = String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  
  // Resolve the request key to a DB column via the sort map.
  const resolved = sortMap[sortBy];
  
  if (resolved) {
    return {
      sortBy:          resolved,
      sortOrder:       normalizedOrder,
      additionalSorts: [],
    };
  }
  
  // sortBy was unmapped — fall back to defaultSort.
  // defaultSort must be a fully qualified column (e.g. 'a.created_at'),
  // not a bare column name, to avoid ambiguity in aliased queries.
  const fallbackSorts = Array.isArray(defaultSort)
    ? defaultSort
    : [defaultSort].filter(Boolean); // guard against null default
  
  if (!fallbackSorts.length) {
    throw AppError.validationError(`Unmapped sortBy key with no fallback: "${sortBy}"`, {
      context: 'sort-resolver/resolveSort',
      meta:    { sortBy, moduleKey },
    });
  }
  
  const [primary, ...rest] = fallbackSorts;
  
  return {
    sortBy:    primary,
    sortOrder: normalizedOrder,
    // Additional columns provide deterministic tie-breaking for multi-column sorts.
    additionalSorts: rest.map((col) => ({
      column:    col,
      direction: 'ASC',
    })),
  };
};

module.exports = {
  resolveSort,
};
