const AppError = require('../utils/AppError');
const { logSystemException, logSystemInfo } = require('../utils/system-logger');
const {
  getPaginatedOrderTypes,
} = require('../repositories/order-type-repository');
const {
  transformPaginatedOrderTypes,
} = require('../transformers/order-type-transformer');
const {
  enforceOrderTypeCodeAccessControl,
  filterOrderTypeRowsByPermission,
} = require('../business/order-type-business');

/**
 * Fetches paginated order types with optional filtering, sorting, and logging.
 *
 * Applies sorting rules based on the order type sort map,
 * transforms raw DB rows into client-friendly format,
 * and logs the operation for monitoring.
 *
 * @param {Object} options - Service options.
 * @param {Object} [options.filters={}] - Filters to apply (e.g., category, keyword, requiresPayment).
 * @param {Object} [options.user] - The user performing the request (for audit logging).
 * @param {number} [options.page=1] - Page number (1-based).
 * @param {number} [options.limit=10] - Number of records per page.
 * @param {string} [options.sortBy='name'] - Field to sort by (uses orderTypeSortMap).
 * @param {'ASC'|'DESC'} [options.sortOrder='ASC'] - Sort direction.
 *
 * @returns {Promise<Object>} Paginated result containing transformed order type rows and pagination metadata.
 *
 * @throws {AppError} Throws a service error if fetching fails.
 */
const fetchPaginatedOrderTypesService = async ({
  filters = {},
  user,
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'ASC',
}) => {
  try {
    await enforceOrderTypeCodeAccessControl({
      user,
      filters,
      sortBy,
    });

    const rawResult = await getPaginatedOrderTypes({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const filteredRows = await filterOrderTypeRowsByPermission(rawResult, user);

    const result = transformPaginatedOrderTypes(filteredRows, user);

    logSystemInfo('Fetched paginated order types', {
      context: 'order-type-service/fetchPaginatedOrderTypesService',
      userId: user?.id,
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated order types', {
      context: 'order-type-service/fetchPaginatedOrderTypesService',
      userId: user?.id,
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });

    throw AppError.serviceError('Failed to fetch order type list.');
  }
};

module.exports = {
  fetchPaginatedOrderTypesService,
};
