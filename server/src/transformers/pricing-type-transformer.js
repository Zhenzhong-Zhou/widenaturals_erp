/**
 * Transforms a raw pricing type DB row into a formatted object.
 *
 * @param {object} row - Raw row from the database.
 * @returns {object} - Transformed pricing type object.
 */
const transformPricingTypeRow = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  slug: row.slug || null,
  description: row.description || null,
  status: row.status,
  statusDate: row.status_date ? new Date(row.status_date).toISOString() : null,
  createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
  createdByFullName: row.created_by_fullname || null,
  updatedByFullName: row.updated_by_fullname || null,
});

/**
 * Transforms an array of raw pricing type rows.
 *
 * @param {Array<object>} rows - Raw rows from the database.
 * @returns {Array<object>} - Transformed pricing type list.
 */
const transformPricingTypeList = (rows = []) => rows.map(transformPricingTypeRow);

/**
 * Transforms a paginated result of pricing types.
 *
 * @param {object} paginatedResult - Raw paginated DB result.
 * @param {Array<object>} paginatedResult.data - Raw pricing type rows.
 * @param {number} paginatedResult.page - Current page number.
 * @param {number} paginatedResult.limit - Items per page.
 * @param {number} paginatedResult.totalRecords - Total number of records.
 * @param {number} paginatedResult.totalPages - Total number of pages.
 * @returns {object} - Transformed response with pagination and formatted pricing types.
 */
const transformPaginatedPricingTypeResult = (paginatedResult) => ({
  pagination: {
    page: Number(paginatedResult.pagination?.page ?? 1),
    limit: Number(paginatedResult.pagination?.limit ?? 10),
    totalRecords: Number(paginatedResult.pagination?.totalRecords ?? 0),
    totalPages: Number(paginatedResult.pagination?.totalPages ?? 1),
  },
  data: transformPricingTypeList(paginatedResult.data),
});

module.exports = {
  transformPaginatedPricingTypeResult,
};