/**
 * @file sort-validator.js
 * @description
 * Pre-query sorting configuration validator.
 *
 * Validates the fully assembled sorting configuration before any SQL is
 * constructed. Enforces mutual exclusion between raw and dynamic sorting
 * modes, and ensures a whitelist is present whenever dynamic sorting is used.
 *
 * This module has no I/O and no pg dependency — it operates purely on
 * the sorting parameter object passed by the query builder.
 *
 * Intended call order:
 *   resolveSort(...)          → maps request key to DB column
 *   validateSortingConfig(...)→ validates the assembled config  ← this file
 *   buildPaginatedQuery(...)  → constructs SQL
 */

'use strict';

const AppError = require('../AppError');

/**
 * Validates the assembled sorting configuration for a paginated query.
 *
 * Enforces two rules:
 * 1. `rawOrderBy` and dynamic sorting (`sortBy` / `additionalSorts`) are
 *    mutually exclusive — using both simultaneously is a programming error.
 * 2. Dynamic sorting requires a non-empty `whitelistSet` — building an
 *    ORDER BY clause without one would allow unsanitized column names into SQL.
 *
 * Does not return a value. Throws on any violation so the query builder
 * can fail fast before touching the database.
 *
 * @param {object}      params
 * @param {string}      [params.sortBy]              - Resolved DB column to sort by.
 * @param {Array}       [params.additionalSorts=[]]  - Additional sort columns for tie-breaking.
 * @param {string}      [params.rawOrderBy]          - Raw SQL ORDER BY fragment (mutually exclusive with dynamic sorting).
 * @param {Set<string>} [params.whitelistSet]        - Allowed sort columns; required when using dynamic sorting.
 * @param {string}      params.context               - Caller context label for error messages.
 * @returns {void}
 * @throws {AppError} On missing context, invalid additionalSorts type,
 *                    conflicting sort modes, or missing whitelist.
 *
 * @example
 * // Dynamic sorting — whitelist required
 * validateSortingConfig({
 *   sortBy: 'a.created_at',
 *   additionalSorts: [],
 *   whitelistSet: new Set(['a.created_at', 'p.name']),
 *   context: 'order-repository/getPaginatedOrders',
 * });
 *
 * @example
 * // Raw ORDER BY — dynamic sorting must be absent
 * validateSortingConfig({
 *   rawOrderBy: 'a.created_at DESC, a.id ASC',
 *   context: 'order-repository/getPaginatedOrders',
 * });
 */
const validateSortingConfig = ({
  sortBy,
  additionalSorts = [],
  rawOrderBy,
  whitelistSet,
  context,
}) => {
  // context is required on every call so error messages are always traceable.
  if (!context || typeof context !== 'string') {
    throw AppError.validationError('Invalid context for sorting validation');
  }

  if (!Array.isArray(additionalSorts)) {
    throw AppError.validationError('additionalSorts must be an array', {
      context,
    });
  }

  // Dynamic sorting is active when either a primary sort column or at least
  // one additional sort column is present.
  const hasDynamicSort = Boolean(sortBy) || additionalSorts.length > 0;

  // rawOrderBy and dynamic sorting write to the same ORDER BY clause —
  // combining them would produce ambiguous or malformed SQL.
  if (rawOrderBy && hasDynamicSort) {
    throw AppError.validationError(
      'Cannot use rawOrderBy with dynamic sorting',
      { context }
    );
  }

  // Dynamic sorting delegates column safety to safeOrderBy, which requires
  // a whitelist. Failing here early is cleaner than failing inside SQL construction.
  if (hasDynamicSort) {
    if (!(whitelistSet instanceof Set) || whitelistSet.size === 0) {
      throw AppError.validationError(
        'whitelistSet is required for dynamic sorting',
        { context }
      );
    }
  }
};

module.exports = {
  validateSortingConfig,
};
