/**
 * @file query-normalizers.js
 * @description HTTP boundary utilities for normalizing raw Express query parameters.
 *
 * These functions handle the "client → server" edge: coercing untrusted, loosely
 * typed req.query values into clean, predictable shapes before they reach service
 * or database logic.
 *
 * Functions here know nothing about SQL or database columns — for SQL-layer safety
 * (identifier quoting, ORDER BY whitelisting), see sql-ident.js instead.
 */

/**
 * Normalizes a query parameter into an array of trimmed strings.
 *
 * - If the input is null or undefined, returns undefined.
 * - If the input is an array, filters falsy values and trims each remaining string.
 * - If the input is a comma-separated string, splits, trims, and filters empty segments.
 * - If the input is a single non-empty string, trims and wraps it in an array.
 * - If the input is any other type (e.g., number), converts to string, trims, and wraps in an array.
 *
 * @param {string | string[] | null | undefined | any} value - The raw query parameter value.
 * @returns {string[] | undefined} Normalized array of trimmed strings, or undefined if input is nullish.
 */
const normalizeParamArray = (value) => {
  if (value === undefined || value === null) return undefined;
  
  if (Array.isArray(value)) {
    return value.filter(Boolean).map((v) => String(v).trim()).filter(Boolean);
  }
  
  if (typeof value === 'string') {
    return value.includes(',')
      ? value.split(',').map((v) => v.trim()).filter(Boolean)
      : [value.trim()].filter(Boolean);
  }
  
  return [String(value).trim()];
};

/**
 * Normalizes pagination-related query parameters with safe defaults and bounds.
 *
 * Parses page, limit, and sortOrder from an Express-style query object,
 * clamping values to safe ranges and defaulting gracefully on invalid input.
 *
 * Bounds:
 *  - page      : minimum 1 (no upper bound)
 *  - limit     : clamped to [1, 100], defaults to 10
 *  - sortOrder : 'ASC' or 'DESC' only; anything else defaults to 'DESC'
 *
 * @param {Object} [query={}] - Express request query object (req.query).
 * @param {string|number} [query.page]      - Desired page number.
 * @param {string|number} [query.limit]     - Items per page.
 * @param {string}        [query.sortOrder] - Sort direction ('ASC' or 'DESC').
 * @returns {{ page: number, limit: number, sortOrder: 'ASC' | 'DESC' }}
 */
const normalizePaginationParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  
  // Delegate sortOrder normalization — single source of truth
  const sortOrder = normalizeSortOrder(query.sortOrder);
  
  return { page, limit, sortOrder };
};

/**
 * Normalizes the keys of a filter object by trimming surrounding whitespace.
 *
 * Useful when filter keys originate from raw query strings where keys may
 * have accidental leading/trailing spaces (e.g., ' code ' → 'code').
 * Values are passed through unchanged.
 *
 * @param {Object} rawFilters - An object of unprocessed query filters.
 * @returns {Object} A new object with whitespace-trimmed keys and original values.
 */
const normalizeFilterKeys = (rawFilters) => {
  if (!rawFilters || typeof rawFilters !== 'object') return {};
  
  return Object.fromEntries(
    Object.entries(rawFilters).map(([key, value]) => [key.trim(), value])
  );
};

/**
 * Normalizes a raw sort order string to a valid SQL direction.
 *
 * Accepts any casing. Defaults to 'DESC' for anything that isn't 'ASC'.
 * This is the single source of truth for sort direction normalization —
 * normalizePaginationParams delegates here rather than duplicating the logic.
 *
 * @param {string} [raw=''] - Raw sortOrder value from req.query.
 * @returns {'ASC' | 'DESC'}
 */
const normalizeSortOrder = (raw = '') => {
  if (typeof raw !== 'string') return 'DESC';
  return raw.trim().toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
};

module.exports = {
  normalizeParamArray,
  normalizePaginationParams,
  normalizeFilterKeys,
  normalizeSortOrder,
};
