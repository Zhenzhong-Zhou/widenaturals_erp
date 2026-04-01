/**
 * @file build-status-filter.js
 * @description SQL WHERE clause builder for status queries.
 *
 * Pure function — no DB access, no logging, no side effects on inputs.
 * Joi middleware validates inputs upstream; no defensive try/catch needed here.
 *
 * The paginated list and lookup query share the same flat table with no joins,
 * so a single filter builder covers both call sites.
 *
 * Exports:
 *  - buildStatusFilter
 */

'use strict';

const { addIlikeFilter } = require('./sql-helpers');

// ─── Filter Builder ───────────────────────────────────────────────────────────

/**
 * Builds a parameterised SQL WHERE clause for status queries.
 *
 * Used by both the paginated list and the dropdown lookup — the schema
 * is a flat table with no joins, so one builder covers both.
 *
 * @param {Object}  [filters={}]
 * @param {string}  [filters.id]          - Exact match on status UUID.
 * @param {boolean} [filters.is_active]   - Exact match on active flag.
 * @param {string}  [filters.name]        - Exact match on status name.
 * @param {string}  [filters.name_ilike]  - ILIKE match on status name.
 * @param {string}  [filters.keyword]     - Fuzzy search across name and description.
 *
 * @returns {{ whereClause: string, params: Array }}
 */
const buildStatusFilter = (filters = {}) => {
  /** @type {string[]} */
  const conditions = ['1=1'];
  
  /** @type {any[]} */
  const params = [];
  
  /** @type {number} */
  let idx = 1;
  
  // ─── Exact match: id ──────────────────────────────────────────────────────────
  
  if (filters.id) {
    conditions.push(`s.id = $${idx}`);
    params.push(filters.id);
    idx++;
  }
  
  // ─── Boolean: is_active ───────────────────────────────────────────────────────
  
  if (typeof filters.is_active === 'boolean') {
    conditions.push(`s.is_active = $${idx}`);
    params.push(filters.is_active);
    idx++;
  }
  
  // ─── Name: exact + ilike ─────────────────────────────────────────────────────
  
  if (filters.name) {
    conditions.push(`s.name = $${idx}`);
    params.push(filters.name);
    idx++;
  }
  
  idx = addIlikeFilter(conditions, params, idx, filters.name_ilike, 's.name');
  
  // ─── Keyword (must remain last) ───────────────────────────────────────────────
  
  if (filters.keyword) {
    // Collapse internal whitespace before wrapping — prevents double-space
    // literals from breaking ILIKE matches on normalized DB values.
    const kw = `%${filters.keyword.trim().replace(/\s+/g, ' ')}%`;
    conditions.push(`(
      s.name        ILIKE $${idx} OR
      s.description ILIKE $${idx}
    )`);
    params.push(kw);
    idx++;
  }
  
  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

module.exports = {
  buildStatusFilter,
};
