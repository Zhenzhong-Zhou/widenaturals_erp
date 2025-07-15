/**
 * Normalizes a query parameter into an array of trimmed strings.
 *
 * - If the input is a comma-separated string, splits it into an array.
 * - If the input is already an array, returns a filtered array (removing falsy values).
 * - If the input is a single non-empty string, wraps it in an array.
 * - If the input is null or undefined, returns undefined.
 * - If the input is any other type (e.g., number), converts it to a string and wraps in an array.
 *
 * @param {string | string[] | undefined | null | any} value - The raw query parameter value.
 * @returns {string[] | undefined} - Normalized array of trimmed strings, or undefined.
 */
const normalizeParamArray = (value) => {
  if (value === undefined || value === null) return undefined;
  
  if (Array.isArray(value)) return value.filter(Boolean);
  
  if (typeof value === 'string') {
    return value.includes(',')
      ? value.split(',').map((v) => v.trim()).filter(Boolean)
      : [value.trim()];
  }
  
  return [String(value).trim()];
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
