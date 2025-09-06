const { query, paginateQueryByOffset } = require('../database/db');
const {
  buildDiscountFilter
} = require('../utils/sql/build-discount-filters');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');

/**
 * Retrieves discount details by ID.
 * Does not perform validity checks (e.g., time range); use a lookup/service function if needed.
 *
 * @param {UUID} discountId - The ID of the discount to fetch.
 * @param {Object} client - Optional transaction client.
 * @returns {Promise<Object|null>} - The discount details (e.g., type, value, validity dates) or null if not found.
 */
const getDiscountById = async (discountId, client = null) => {
  const sql = `
    SELECT discount_type, discount_value
    FROM discounts
    WHERE id = $1
  `;

  try {
    const result = await query(sql, [discountId], client);
    return result.rows[0] || null; // Return the discount object or null if not found
  } catch (error) {
    logSystemException(error, 'Failed to fetch discount by ID', {
      context: 'discount-repository/getDiscountById',
      query: sql,
      discountId,
    });

    throw AppError.databaseError(`Failed to fetch discount: ${error.message}`);
  }
};

/**
 * Retrieves a paginated list of discount records for use in dropdown or autocomplete components.
 *
 * Supports filtering by keyword, active status, creator, validity dates, and other metadata.
 * Results are returned in ascending order by name to ensure predictable dropdown behavior.
 *
 * Typically used in client UI components where users select available discounts,
 * such as in pricing or promotional forms.
 *
 * @param {Object} options - Lookup options
 * @param {number} [options.limit=50] - Maximum number of results to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {Object} [options.filters={}] - Optional filter fields (e.g., keyword, isActive, createdBy)
 * @returns {Promise<{ items: { label: string, value: string }[], hasMore: boolean }>} - Paginated dropdown data
 *
 * @throws {AppError} If an error occurs while querying the database
 */
const getDiscountsLookup = async ({
                                    limit = 50,
                                    offset = 0,
                                    filters = {},
                                  }) => {
  const tableName = 'discounts d';
  const { whereClause, params } = buildDiscountFilter(filters);
  // todo include discount_type and discount_value
  const queryText = `
    SELECT
      d.id,
      d.name,
      d.status_id,
      d.valid_from,
      d.valid_to
    FROM ${tableName}
    WHERE ${whereClause}
  `;
  
  try {
    const result = await paginateQueryByOffset({
      tableName,
      whereClause,
      queryText,
      params,
      offset,
      limit,
      sortBy: 'd.name',
      sortOrder: 'ASC',
      additionalSort: 'd.name ASC',
    });
    
    logSystemInfo('Fetched discounts lookup successfully', {
      context: 'discounts-repository/getDiscountsLookup',
      totalFetched: result.data?.length ?? 0,
      offset,
      limit,
      filters,
    });
    
    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch discounts lookup', {
      context: 'discounts-repository/getDiscountsLookup',
      offset,
      limit,
      filters,
    });
    throw AppError.databaseError('Failed to fetch discounts options.');
  }
};

module.exports = {
  getDiscountById,
  getDiscountsLookup,
};
