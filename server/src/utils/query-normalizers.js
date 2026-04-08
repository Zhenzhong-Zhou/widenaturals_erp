/**
 * @file query-normalizers.js
 * @module utils/query/query-normalizers
 *
 * @description
 * HTTP boundary utilities for normalizing raw Express query parameters.
 *
 * These functions handle the "client → server" edge: coercing untrusted,
 * loosely typed req.query values into clean, predictable shapes before they
 * reach service or database logic.
 *
 * Functions here know nothing about SQL or database columns — for SQL-layer
 * safety (identifier quoting, ORDER BY whitelisting), see sql-ident.js instead.
 */

'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// Shared bounds
// Defined once so all functions stay in sync if limits ever change.
// ─────────────────────────────────────────────────────────────────────────────

const LIMIT_MIN            = 1;
const LIMIT_MAX            = 100;
const PAGE_MIN             = 1;
const OFFSET_MIN           = 0;
const DEFAULT_LIMIT_PAGE   = 10;
const DEFAULT_LIMIT_OFFSET = 50;

// ─────────────────────────────────────────────────────────────────────────────
// normalizeParamArray
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes a query parameter into an array of trimmed, non-empty strings.
 *
 * Handles all shapes a query param can arrive in from Express:
 *   - null / undefined       → undefined  (param was absent)
 *   - string[]               → filter falsy, trim each item
 *   - comma-separated string → split on ',', trim, filter empty segments
 *   - single string          → trim, wrap in array
 *   - any other type         → coerce to string, trim, wrap in array
 *
 * @param {string | string[] | null | undefined | any} value - Raw query param value.
 * @returns {string[] | undefined} Normalized array, or undefined if input is nullish.
 *
 * @example
 * normalizeParamArray('a, b, c')   // ['a', 'b', 'c']
 * normalizeParamArray(['a', 'b'])  // ['a', 'b']
 * normalizeParamArray(null)        // undefined
 */
const normalizeParamArray = (value) => {
  if (value === undefined || value === null) return undefined;
  
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
  }
  
  if (typeof value === 'string') {
    // Split on comma for multi-value params (e.g. '?status=active,archived')
    return value.includes(',')
      ? value.split(',').map((v) => v.trim()).filter(Boolean)
      : value.trim()
        ? [value.trim()]
        : undefined; // empty string after trim → treat as absent
  }
  
  // Numeric or other scalar — coerce and wrap
  return [String(value).trim()];
};

// ─────────────────────────────────────────────────────────────────────────────
// normalizePageParams
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes page-based pagination parameters for table and list views.
 *
 * Use when the caller navigates by page number (page=1, page=2, ...).
 * Offset is derived internally — callers must not pass offset directly,
 * as it would be silently ignored and create inconsistency.
 *
 * Bounds:
 *   page  : minimum 1, no upper bound
 *   limit : clamped to [1, 100], defaults to 10
 *
 * @param {object}        [query={}]
 * @param {string|number} [query.page=1]    - Desired page number.
 * @param {string|number} [query.limit=10]  - Items per page.
 * @param {string}        [query.sortOrder] - 'ASC' or 'DESC' (case-insensitive).
 *
 * @returns {{ page: number, limit: number, offset: number, sortOrder: 'ASC'|'DESC' }}
 */
const normalizePageParams = (query = {}) => {
  const page  = Math.max(PAGE_MIN,  parseInt(query.page,  10) || PAGE_MIN);
  const limit = Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, parseInt(query.limit, 10) || DEFAULT_LIMIT_PAGE));
  
  // offset is always derived — never read from query in page-based mode.
  // Reading query.offset here would cause page and offset to disagree.
  const offset = (page - 1) * limit;
  
  const sortOrder = normalizeSortOrder(query.sortOrder);
  
  return { page, limit, offset, sortOrder };
};

// ─────────────────────────────────────────────────────────────────────────────
// normalizeOffsetParams
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes offset-based pagination parameters for dropdown and lookup views.
 *
 * Use when the caller navigates by raw offset (offset=0, offset=50, ...).
 * Page number is not computed or returned — it is meaningless in offset mode
 * and returning it would risk callers reading a wrong value when offset is
 * not a clean multiple of limit (e.g. offset=35, limit=10 → page=4.5).
 *
 * Bounds:
 *   offset : minimum 0, no upper bound
 *   limit  : clamped to [1, 100], defaults to 50
 *
 * @param {object}        [query={}]
 * @param {string|number} [query.offset=0]  - Record offset.
 * @param {string|number} [query.limit=50]  - Items per fetch.
 * @param {string}        [query.sortOrder] - 'ASC' or 'DESC' (case-insensitive).
 *
 * @returns {{ offset: number, limit: number, sortOrder: 'ASC'|'DESC' }}
 */
const normalizeOffsetParams = (query = {}) => {
  const limit  = Math.min(LIMIT_MAX, Math.max(LIMIT_MIN, parseInt(query.limit,  10) || DEFAULT_LIMIT_OFFSET));
  const offset = Math.max(OFFSET_MIN,                    parseInt(query.offset, 10) || OFFSET_MIN);
  
  const sortOrder = normalizeSortOrder(query.sortOrder);
  
  return { offset, limit, sortOrder };
};

// ─────────────────────────────────────────────────────────────────────────────
// normalizeFilterKeys
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes filter object keys by trimming surrounding whitespace.
 *
 * Useful when filter keys originate from raw query strings where accidental
 * leading/trailing spaces may appear (e.g. ' code ' → 'code').
 * Values are passed through unchanged.
 *
 * @param {object} rawFilters - Unprocessed query filter object.
 * @returns {object} New object with whitespace-trimmed keys and original values.
 *
 * @example
 * normalizeFilterKeys({ ' status ': 'active', 'type': 'product' })
 * // { status: 'active', type: 'product' }
 */
const normalizeFilterKeys = (rawFilters) => {
  if (!rawFilters || typeof rawFilters !== 'object') return {};
  
  return Object.fromEntries(
    Object.entries(rawFilters).map(([key, value]) => [key.trim(), value])
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// normalizeSortOrder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalizes a raw sort order string to a valid SQL direction.
 *
 * Accepts any casing. Defaults to 'DESC' for anything that is not 'ASC'.
 * This is the single source of truth for sort direction normalization —
 * normalizePageParams and normalizeOffsetParams both delegate here.
 *
 * @param {string} [raw=''] - Raw sortOrder value from req.query.
 * @returns {'ASC' | 'DESC'}
 *
 * @example
 * normalizeSortOrder('asc')   // 'ASC'
 * normalizeSortOrder('DESC')  // 'DESC'
 * normalizeSortOrder('')      // 'DESC'
 * normalizeSortOrder(null)    // 'DESC'
 */
const normalizeSortOrder = (raw = '') => {
  if (typeof raw !== 'string') return 'DESC';
  return raw.trim().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  normalizeParamArray,
  normalizePageParams,
  normalizeOffsetParams,
  normalizeFilterKeys,
  normalizeSortOrder,
};
