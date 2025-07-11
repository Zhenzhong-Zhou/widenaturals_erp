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
  normalizeFilterKeys,
};
