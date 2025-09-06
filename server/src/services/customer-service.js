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
  evaluateCustomerLookupAccessControl,
  enforceCustomerLookupVisibilityRules,
} = require('../business/customer-business');
const { getStatusId } = require('../config/status-cache');

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
      
      return Promise.all(
        enrichedRecords.map((customer) =>
          filterCustomerForViewer(customer, user, purpose)
        )
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
 * Fetches paginated and filtered customer records for admin or internal UIs,
 * applying user-based permission rules and sorting safety.
 *
 * This service:
 * - Enforces visibility constraints based on user access level (e.g., view active only vs all customers)
 * - Applies dynamic filters like region, keyword, and date range
 * - Sanitizes `sortBy` field via a `customerSortMap` to prevent unsafe SQL usage
 * - Delegates database access to the repository and result transformation to the transformer layer
 *
 * @param {Object} params - Parameters object.
 * @param {Object} params.user - Authenticated user object (used to resolve access scope and restrictions).
 * @param {Object} [params.filters={}] - Optional filters to apply.
 * @param {string} [filters.region] - Filter by region (if implemented).
 * @param {string} [filters.country] - Filter by country (if implemented).
 * @param {string} [filters.createdBy] - Filter customers created by specific user ID.
 * @param {string} [filters.keyword] - Partial keyword search (matches firstname, lastname, email, phone).
 * @param {string} [filters.createdAfter] - Filter by `created_at >=` date (ISO string).
 * @param {string} [filters.createdBefore] - Filter by `created_at <=` date (ISO string).
 * @param {string} [filters.statusDateAfter] - Filter by `status_date >=` (ISO string).
 * @param {string} [filters.statusDateBefore] - Filter by `status_date <=` (ISO string).
 * @param {boolean} [filters.isArchived] - Whether to include archived customers (if supported).
 *
 * @param {number} [params.page=1] - Page number for pagination (1-based).
 * @param {number} [params.limit=10] - Number of results per page.
 * @param {string} [params.sortBy='created_at'] - Logical field to sort by (must be mapped via `customerSortMap`).
 * @param {'ASC' | 'DESC'} [params.sortOrder='DESC'] - Sort direction.
 *
 * @returns {Promise<{
 *   data: Array<CustomerResponse>,
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} - Paginated and transformed customer results with metadata.
 *
 * @throws {AppError} - Throws if permissions cannot be evaluated, a query fails, or transformation fails.
 *
 * @example
 * const result = await fetchPaginatedCustomersService({
 *   user,
 *   filters: { keyword: 'john', onlyWithAddress: true },
 *   page: 2,
 *   limit: 25,
 *   sortBy: 'created_at',
 *   sortOrder: 'ASC',
 * });
 *
 * // result = {
 * // data: [...],
 * // pagination: {
 * // page: 2,
 * // limit: 25,
 * // totalRecords: 120,
 * // totalPages: 5
 * // }
 * // }
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
    // Step 1: Evaluate user access
    const userAccess = await evaluateCustomerLookupAccessControl(user);
    
    // Step 2: Enforce visibility rules (e.g., restrict statusId)
    const activeStatusId = getStatusId('customer_active'); // assumed utility
    const adjustedFilters = enforceCustomerLookupVisibilityRules(filters, userAccess, activeStatusId);
    
    // Step 3: Fetch paginated customer records
    const rawResult = await getPaginatedCustomers({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // Step 4: Transform result for UI
    const result = transformPaginatedCustomerResults(rawResult, userAccess);
    
    // Step 5: Log success
    logSystemInfo('Fetched paginated customers', {
      context: 'customer-service/fetchPaginatedCustomersService',
      userId: user?.id,
      filters: adjustedFilters,
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
    
    throw AppError.serviceError('Failed to fetch customer list.', {
      details: error.message,
      stage: 'fetchPaginatedCustomersService',
    });
  }
};

module.exports = {
  createCustomersService,
  fetchPaginatedCustomersService,
};
