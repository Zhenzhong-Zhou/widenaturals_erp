const MAX_LIMITS = require('../utils/constants/general/max-limits');
const { validateBulkInputSize } = require('../utils/bulk-input-validator');
const AppError = require('../utils/AppError');
const {
  insertCustomerRecords,
  getEnrichedCustomersByIds,
  getPaginatedCustomers,
} = require('../repositories/customer-repository');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const { withTransaction } = require('../database/db');
const {
  transformEnrichedCustomers,
  transformPaginatedCustomerResults,
} = require('../transformers/customer-transformer');
const {
  prepareCustomersForInsert,
  filterCustomerForViewer,
  resolveCustomerQueryOptions,
} = require('../business/customer-business');

/**
 * Creates multiple customers in bulk with validation and conflict handling.
 * Wraps the insertion in a database transaction to ensure atomicity.
 *
 * - Validates and enriches customer data (status, created_by, etc.)
 * - Uses `ON CONFLICT` upsert behavior on email + phone_number
 * - Returns inserted or updated customer records (filtered by permission)
 *
 * @param {Array<Object>} customers - List of raw customer objects to insert
 * @param {Object} user - Authenticated user object with a role and id
 * @param {string} [purpose='insert_response'] - Use-case-specific filtering key
 * @returns {Promise<Array<Object>>} - Filtered inserted/enriched customer records
 * @throws {AppError} - Wrapped service-level error
 */
const createCustomersService = async (
  customers,
  user,
  purpose = 'insert_response'
) => {
  const createdBy = user.id;

  return withTransaction(async (client) => {
    try {
      const max = MAX_LIMITS.BULK_INPUT_LIMITS.MAX_UI_INSERT_SIZE;

      validateBulkInputSize(
        customers,
        max,
        'customer-service/createCustomersService',
        'customers'
      );

      logSystemInfo('Preparing customer data for insert', {
        count: customers.length,
        context: 'customer-service/createCustomers',
      });

      const preparedCustomers = await prepareCustomersForInsert(
        customers,
        createdBy
      );

      const inserted = await insertCustomerRecords(preparedCustomers, client);

      if (!Array.isArray(inserted) || inserted.length === 0) {
        throw AppError.databaseError('No customer records were inserted.');
      }

      const insertedIds = inserted.map((row) => row.id);

      logSystemInfo('Customer bulk insert completed', {
        insertedCount: inserted.length,
        context: 'customer-service/createCustomers',
      });

      const rawResult = await getEnrichedCustomersByIds(insertedIds, client);
      const enrichedRecords = transformEnrichedCustomers(rawResult);

      return enrichedRecords.map((customer) =>
        filterCustomerForViewer(customer, user, purpose)
      );
    } catch (error) {
      logSystemException(error, 'Failed to create customers in transaction', {
        context: 'customer-service/createCustomers',
        requestedBy: createdBy,
        customerCount: customers?.length,
      });

      throw AppError.serviceError(
        'Failed to create customers in transaction',
        error
      );
    }
  });
};

/**
 * Fetches paginated customer records with optional filters and permission-based visibility control.
 *
 * This service function:
 * - Applies permission-aware defaults (e.g., only fetch active customers unless the user has 'view_all_customers')
 * - Supports flexible filtering, pagination, and sorting
 * - Delegates database access to the repository layer and response formatting to the transformer layer
 * - Sanitizes `sortBy` using the customerSortMap to prevent invalid SQL expressions
 *
 * @param {Object} user - Authenticated user object (used to determine permission scope)
 * @param {Object} [filters={}] - Optional filters to apply:
 * @param {string} [filters.region] - Filter by region
 * @param {string} [filters.country] - Filter by country
 * @param {string} [filters.createdBy] - Filter by creator user ID
 * @param {string} [filters.keyword] - Keyword search on name, email, or phone
 * @param {string} [filters.createdAfter] - Filter by creation date (after)
 * @param {string} [filters.createdBefore] - Filter by creation date (before)
 * @param {string} [filters.statusDateAfter] - Filter by status date (after)
 * @param {string} [filters.statusDateBefore] - Filter by status date (before)
 * @param {boolean} [filters.isArchived] - Explicitly filter archived vs non-archived
 *
 * @param {number} [page=1] - Page number for pagination (1-based)
 * @param {number} [limit=10] - Number of items per page
 * @param {string} [sortBy='createdAt'] - Logical field to sort by (must match keys in customerSortMap)
 * @param {string} [sortOrder='DESC'] - Sort direction ('ASC' or 'DESC')
 *
 * @returns {Promise<{
 *   data: CustomerResponse[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} - Paginated, transformed customer result
 *
 * @throws {AppError} - Throws if the query or transformation fails
 */
const fetchPaginatedCustomersService = async ({
  filters = {},
  user,
  page = 1,
  limit = 10,
  sortBy = 'created_at',
  sortOrder = 'DESC',
}) => {
  try {
    const { statusId, overrideDefaultStatus } =
      await resolveCustomerQueryOptions(user);

    const rawResult = await getPaginatedCustomers({
      filters,
      statusId,
      overrideDefaultStatus,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    const result = transformPaginatedCustomerResults(rawResult);

    logSystemInfo('Fetched paginated customers', {
      context: 'customer-service/fetchPaginatedCustomersService',
      userId: user?.id,
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });

    return result;
  } catch (error) {
    logSystemException(error, 'Failed to fetch paginated customers', {
      context: 'customer-service/fetchPaginatedCustomersService',
      userId: user?.id,
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });

    throw AppError.serviceError('Failed to fetch customer list.');
  }
};

module.exports = {
  createCustomersService,
  fetchPaginatedCustomersService,
};
