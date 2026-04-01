/**
 * @file sql-helpers.js
 * @description Reusable SQL fragment construction utilities.
 *
 * Pure functions — no DB access, no logging, no side effects.
 * All identifier inputs are validated through validateIdentifier to prevent
 * SQL injection via dynamic column/table/alias references.
 *
 * Location: src/utils/sql/sql-helpers.js
 *
 * Exports:
 *  - minUuid             — MIN() aggregate for uuid columns via text cast
 *  - addIlikeFilter      — appends a single ILIKE condition to a conditions array
 *  - addKeywordIlikeGroup — appends a multi-field OR ILIKE group to a conditions array
 */

'use strict';

const { validateIdentifier } = require('../sql-ident');
const AppError = require('../AppError');

// ─── UUID Aggregation ─────────────────────────────────────────────────────────

/**
 * Builds a MIN() aggregate expression for an uuid column.
 *
 * PostgreSQL does not support MIN(uuid) directly. Casting to text, applying
 * MIN(), then casting back to uuid is the correct pattern for aggregating
 * uuid columns inside GROUP BY queries.
 *
 * All three identifier arguments are validated before interpolation.
 *
 * @param {string} tableAlias - Table alias (e.g. 'wi_sub').
 * @param {string} column     - Column name (e.g. 'warehouse_status_id').
 * @param {string} alias      - Output alias (e.g. 'warehouse_status_id').
 *
 * @returns {string} SQL fragment e.g. `MIN(wi_sub.warehouse_status_id::text)::uuid AS warehouse_status_id`
 * @throws  {AppError} validationError if any identifier fails validation.
 */
const minUuid = (tableAlias, column, alias) => {
  validateIdentifier(tableAlias);
  validateIdentifier(column);
  validateIdentifier(alias);
  
  return `MIN(${tableAlias}.${column}::text)::uuid AS ${alias}`;
};

// ─── ILIKE Filters ────────────────────────────────────────────────────────────

/**
 * Appends a single ILIKE condition to the conditions array if value is present.
 *
 * No-ops silently when value is falsy — callers do not need to guard before
 * calling. Returns the updated parameter index either way.
 *
 * @param {string[]} conditions - Mutable conditions array to append to.
 * @param {any[]}    params     - Mutable params array to append to.
 * @param {number}   idx        - Current positional parameter index.
 * @param {string}   value      - Filter value; skipped if falsy.
 * @param {string}   field      - Fully qualified column reference (e.g. 'p.name').
 *
 * @returns {number} Updated parameter index.
 */
const addIlikeFilter = (conditions, params, idx, value, field) => {
  if (!value) return idx;
  
  conditions.push(`${field} ILIKE $${idx}`);
  params.push(`%${value}%`);
  
  return idx + 1;
};

/**
 * Appends a multi-field OR ILIKE group to the conditions array.
 *
 * All matching fields share a single bound parameter — the same $N index is
 * referenced across all OR branches, so only one value is pushed to params.
 *
 * Throws if keyword is present but fields is empty or not an array — this
 * indicates a programming error at the call site, not a user input error.
 * Failing closed (1 = 0) would silently return zero results; failing loudly
 * surfaces the bug immediately.
 *
 * @param {string[]} conditions - Mutable conditions array to append to.
 * @param {any[]}    params     - Mutable params array to append to.
 * @param {number}   idx        - Current positional parameter index.
 * @param {string}   keyword    - Search term; skipped if falsy.
 * @param {string[]} fields     - Fully qualified column references to search across.
 *
 * @returns {number} Updated parameter index.
 * @throws  {AppError} validationError if keyword is present but fields is empty or not an array.
 */
const addKeywordIlikeGroup = (conditions, params, idx, keyword, fields) => {
  if (!keyword) return idx;
  
  if (!Array.isArray(fields) || fields.length === 0) {
    throw AppError.validationError(
      'addKeywordIlikeGroup: fields must be a non-empty array when keyword is provided.',
      { keyword, fields }
    );
  }
  
  // Same $N referenced across all OR branches — single param covers all fields.
  const orConditions = fields.map((field) => `${field} ILIKE $${idx}`);
  
  conditions.push(`(${orConditions.join(' OR ')})`);
  params.push(`%${keyword}%`);
  
  return idx + 1;
};

module.exports = {
  minUuid,
  addIlikeFilter,
  addKeywordIlikeGroup,
};
