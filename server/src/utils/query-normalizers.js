/**
 * Normalizes a value into an array of trimmed strings.
 * Accepts comma-separated strings or arrays. Returns undefined if input is falsy.
 *
 * @param {string|string[]|undefined|null} value
 * @returns {string[]|undefined}
 */
const normalizeParamArray = (value) => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  return value.split(',').map((v) => v.trim()).filter(Boolean);
};

/**
 * Normalizes pagination-related query parameters with safe defaults and bounds.
 *
 * This utility expects an object containing optional page, limit, and sortOrder fields (typically from req.query).
 * It ensures pagination values are numeric, bounded, and sortOrder is safely normalized.
 *
 * @param {Object} query - Express request query object
 * @returns {{ page: number, limit: number, sortOrder: 'ASC' | 'DESC' }}
 */
const normalizePaginationParams = (query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 10));
  
  const sortOrderRaw = typeof query.sortOrder === 'string' ? query.sortOrder.toUpperCase() : 'DESC';
  const sortOrder = sortOrderRaw === 'ASC' ? 'ASC' : 'DESC';
  
  return { page, limit, sortOrder };
};

/**
 * Normalizes the keys of a filter object by trimming whitespace.
 *
 * This is useful when handling query parameters from sources like `req.query`,
 * where keys might have leading or trailing whitespace (e.g., `' code '` instead of `'code'`).
 *
 * @param {Object} rawFilters - An object of unprocessed query filters.
 * @returns {Object} A new object with trimmed keys and original values.
 */
const normalizeFilterKeys = (rawFilters) => {
  if (!rawFilters || typeof rawFilters !== 'object') return {};
  
  return Object.fromEntries(
    Object.entries(rawFilters).map(([key, value]) => [key.trim(), value])
  );
};

module.exports = {
  normalizeParamArray,
  normalizePaginationParams,
  normalizeFilterKeys,
};
