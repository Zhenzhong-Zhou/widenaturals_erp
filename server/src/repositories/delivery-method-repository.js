const {
  buildDeliveryMethodFilter,
} = require('../utils/sql/build-delivery-method-filters');
const { paginateQueryByOffset } = require('../database/db');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const AppError = require('../utils/AppError');

/**
 * Retrieves a paginated list of delivery method records for use in dropdown or autocomplete components.
 *
 * Supports filtering by method name, pickup flag, status ID, and keyword search.
 * Typically used in order fulfillment or shipping configuration forms to allow users
 * to select from available delivery or pickup options.
 *
 * @param {Object} options - Lookup options
 * @param {number} [options.limit=50] - Maximum number of results to return
 * @param {number} [options.offset=0] - Offset for pagination
 * @param {Object} [options.filters={}] - Optional filter fields (e.g., isPickupLocation, keyword)
 * @returns {Promise<{ items: { label: string, value: string }[], hasMore: boolean }>} - Paginated dropdown data
 *
 * @throws {AppError} If an error occurs while querying the database
 */
const getDeliveryMethodsLookup = async ({
  limit = 50,
  offset = 0,
  filters = {},
}) => {
  const tableName = 'delivery_methods dm';
  const { whereClause, params } = buildDeliveryMethodFilter(filters);

  const queryText = `
    SELECT
      dm.id,
      dm.method_name AS name,
      dm.is_pickup_location,
      dm.status_id
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
      sortBy: 'dm.method_name',
      sortOrder: 'ASC',
      additionalSort: 'dm.method_name ASC',
    });

    logSystemInfo('Fetched delivery methods lookup successfully', {
      context: 'delivery_methods-repository/getDeliveryMethodsLookup',
      totalFetched: result.data?.length ?? 0,
      offset,
      limit,
      filters,
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch delivery methods lookup', {
      context: 'delivery_methods-repository/getDeliveryMethodsLookup',
      offset,
      limit,
      filters,
    });
    throw AppError.databaseError('Failed to fetch delivery methods options.');
  }
};

module.exports = {
  getDeliveryMethodsLookup,
};
