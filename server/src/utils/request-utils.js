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

module.exports = {
  normalizePaginationParams,
};
