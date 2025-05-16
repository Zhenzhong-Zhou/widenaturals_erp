/**
 * Transforms a generic paginated result using a row-level transformer.
 *
 * @param {Object} paginatedResult - The paginated query result.
 * @param {Function} transformFn - Function to apply to each data row.
 * @returns {Object} Transformed result with formatted pagination and data.
 */
const transformPaginatedResult = (paginatedResult, transformFn) => ({
  data: (paginatedResult.data || []).map(transformFn),
  pagination: {
    page: Number(paginatedResult.pagination?.page ?? 1),
    limit: Number(paginatedResult.pagination?.limit ?? 10),
    totalRecords: Number(paginatedResult.pagination?.totalRecords ?? 0),
    totalPages: Number(paginatedResult.pagination?.totalPages ?? 1),
  },
});

module.exports = { transformPaginatedResult };