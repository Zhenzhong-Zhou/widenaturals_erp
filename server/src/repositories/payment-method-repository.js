const { paginateQueryByOffset } = require('../database/db');
const {
  buildPaymentMethodFilter,
} = require('../utils/sql/build-payment-method-filters');
const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');

/**
 * Retrieves a paginated list of payment methods for dropdown components.
 *
 * Supports filtering by keyword, isActive flag, and sorting by display order.
 * Typically used in UI components like dropdowns or autocomplete fields.
 *
 * @param {Object} options - Filter and pagination options
 * @param {number} [options.limit=50] - Number of records to fetch
 * @param {number} [options.offset=0] - Pagination offset
 * @param {Object} [options.filters={}] - Filter criteria (e.g., keyword, isActive)
 * @returns {Promise<{ items: { label: string, value: string }[], hasMore: boolean }>}
 *
 * @throws {AppError} - If the database query fails
 */
const getPaymentMethodLookup = async ({
  limit = 50,
  offset = 0,
  filters = {},
}) => {
  const tableName = 'payment_methods pm';

  const { whereClause, params } = buildPaymentMethodFilter(filters);

  const queryText = `
    SELECT
      pm.id,
      pm.name,
      pm.is_active
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
      sortBy: 'pm.display_order',
      sortOrder: 'ASC',
      additionalSort: 'pm.display_order ASC, pm.name ASC',
    });

    logSystemInfo('Fetched payment method dropdown successfully', {
      context: 'payment-method-repository/getPaymentMethodLookup',
      totalFetched: result.data?.length ?? 0,
      offset,
      limit,
      filters,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch payment method dropdown', {
      context: 'payment-method-repository/getPaymentMethodLookup',
      offset,
      limit,
      filters,
    });
    throw AppError.databaseError('Failed to fetch payment method options.');
  }
};

module.exports = {
  getPaymentMethodLookup,
};
