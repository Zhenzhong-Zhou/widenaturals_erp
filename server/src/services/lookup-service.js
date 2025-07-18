const AppError = require('../utils/AppError');
const {
  getBatchRegistryLookup,
} = require('../repositories/batch-registry-repository');
const {
  getWarehouseLookup,
} = require('../repositories/warehouse-repository');
const {
  transformBatchRegistryPaginatedLookupResult,
  transformWarehouseLookupRows,
  transformLotAdjustmentLookupOptions,
  transformCustomerPaginatedLookupResult,
  transformCustomerAddressesLookupResult,
  transformOrderTypeLookupResult, transformPaymentMethodPaginatedLookupResult,
} = require('../transformers/lookup-transformer');
const {
  logSystemInfo,
  logSystemException
} = require('../utils/system-logger');
const { getLotAdjustmentTypeLookup } = require('../repositories/lot-adjustment-type-repository');
const { getCustomerLookup } = require('../repositories/customer-repository');
const { resolveCustomerQueryOptions } = require('../business/customer-business');
const {
  getCustomerAddressLookupById,
  hasAssignedAddresses
} = require('../repositories/address-repository');
const LOOKUPS = require('../utils/constants/domain/lookup-constants');
const { resolveWarehouseFiltersByPermission } = require('../business/warehouse-business');
const { enforceExternalAccessPermission } = require('../business/lot-adjustment-type-business');
const { getOrderTypeLookup } = require('../repositories/order-type-repository');
const { getFilteredOrderTypes, filterOrderTypeLookupResultByPermission } = require('../business/order-type-business');
const { enforcePaymentMethodAccessControl } = require('../business/payment-method-business');
const { getPaymentMethodLookup } = require('../repositories/payment-method-repository');

/**
 * Service to fetch filtered and paginated batch registry records for lookup UI.
 *
 * @param {Object} options - Query options.
 * @param {Object} options.filters - Filtering parameters.
 * @param {number} [options.limit=50] - Number of records to fetch.
 * @param {number} [options.offset=0] - Offset for pagination.
 * @returns {Promise<Object[]>} - Transformed lookup items.
 */
const fetchBatchRegistryLookupService = async ({
  filters = {},
  limit = 50,
  offset = 0,
}) => {
  try {
    if (limit < 1 || offset < 0) {
      throw AppError.validationError('Invalid pagination parameters.');
    }

    logSystemInfo('Fetching batch registry lookup from service', {
      context: 'lookup-service/fetchBatchRegistryLookupService',
      metadata: { filters, limit, offset },
    });

    const rawResult = await getBatchRegistryLookup({
      filters,
      limit,
      offset,
    });
    return transformBatchRegistryPaginatedLookupResult(rawResult);
  } catch (err) {
    logSystemException(
      err,
      'Failed to fetch batch registry lookup in service',
      {
        context: 'lookup-service/fetchBatchRegistryLookupService',
        filters,
        limit,
        offset,
      }
    );

    throw AppError.serviceError(
      'Failed to fetch batch registry lookup list.',
      {
        details: err.message,
        stage: 'lookup-service/fetchBatchRegistryLookupService',
      }
    );
  }
};

/**
 * Service to fetch a filtered list of warehouses for lookup dropdowns or filter panels.
 *
 * Applies permission-based visibility:
 * - Regular users see only active and non-archived warehouses.
 * - Elevated users (with specific permissions) may see all statuses or archived entries.
 *
 * @param {Object} user - Authenticated user object used for permission evaluation
 * @param {Object} filters - Optional filtering criteria
 * @param {string} [filters.warehouseTypeId] - Filter by warehouse type
 * @param {string} [filters.locationTypeId] - (Deprecated) Included for compatibility but not used
 * @param {boolean} [filters.isArchived] - Optional override to fetch archived records (if permitted)
 * @param {string} [filters.statusId] - Optional override to filter by specific status (if permitted)
 *
 * @returns {Promise<Array>} - List of transformed warehouse lookup results
 *
 * @throws {AppError} - Throws a service-level error if data fetching or transformation fails
 */
const fetchWarehouseLookupService = async (user, filters = {}) => {
  try {
    logSystemInfo('Fetching warehouse lookup in service', {
      context: 'lookup-service/fetchWarehouseLookupService',
      filters,
    });
    
    // Resolve filters based on user permission
    const resolvedFilters = await resolveWarehouseFiltersByPermission(user, filters);
    
    const rawResult = await getWarehouseLookup({ filters: resolvedFilters });
    return transformWarehouseLookupRows(rawResult);
  } catch (err) {
    logSystemException(
      err,
      'Failed to fetch warehouse lookup in service layer',
      {
        context: 'lookup-service/fetchWarehouseLookupService',
        userId: user.id,
        filters,
      }
    );

    throw AppError.serviceError('Could not fetch warehouse lookup', {
      details: err.message,
      stage: 'lookup-service/fetchWarehouseLookupService',
    });
  }
};

/**
 * Fetches and transforms lot adjustment types into a lookup-friendly format.
 *
 * By default, internal-only types such as `'manual_stock_insert'` and `'manual_stock_update'`
 * are excluded unless `excludeInternal` is explicitly set to `false`.
 *
 * If `includeExternal` is true, the user must have `view_external_data` permission,
 * or a business-level error will be thrown.
 *
 * @param {Object} user - The authenticated user object.
 * @param {Object} [filters={}] - Optional filter flags.
 * @param {boolean} [filters.excludeInternal=false] - Whether to exclude internal-only adjustment types.
 * @param {boolean} [filters.includeExternal=false] - Whether to include external-only adjustment types.
 *
 * @returns {Promise<Array<{ value: string, label: string, actionTypeId: string }>>} Transformed lookup options:
 * - `value`: The lot adjustment type ID
 * - `label`: The display name
 * - `actionTypeId`: The associated inventory action type ID
 *
 * @throws {AppError} If fetching or transforming data fails, or if access to external data is not permitted.
 */
const fetchLotAdjustmentLookupService = async (user, filters = {}) => {
  try {
    const includeExternal = !!filters.includeExternal;
    
    // Enforce permission if external types are requested
    await enforceExternalAccessPermission(user, includeExternal);
    
    const rows = await getLotAdjustmentTypeLookup(filters);
    return transformLotAdjustmentLookupOptions(rows);
  } catch (error) {
    logSystemException(error, 'Failed to fetch and transform lot adjustment types', {
      context: 'lookup-service/fetchLotAdjustmentLookupService',
      userId: user?.id,
      filters,
    });
    throw AppError.serviceError('Unable to retrieve adjustment lookup options');
  }
};

/**
 * Service to fetch filtered and paginated customer records for lookup UI,
 * with keyword search and permission-based status filtering.
 *
 * This service provides customer lookup data for dropdowns, autocomplete,
 * or other selection components. It supports:
 * - Partial matching on customer fields (e.g., name, email, phone)
 * - Pagination with limit and offset
 * - Automatic application of user permission rules (e.g., all customers, active customers)
 *
 * @param {Object} options - Query options.
 * @param {string} [options.keyword=''] - Partial search term for lookup.
 * @param {number} [options.limit=50] - Number of records to fetch (default: 50).
 * @param {number} [options.offset=0] - Offset for pagination (default: 0).
 * @param {Object} user - Authenticated user object (for permission checks).
 *
 * @returns {Promise<Object>} Transformed lookup items with pagination metadata:
 *   {
 *     items: Array<{ id: string, label: string }>,
 *     offset: number,
 *     limit: number,
 *     hasMore: boolean
 *   }
 *
 * @throws {AppError} When permissions are not enough, or query fails.
 *
 * @example
 * const result = await fetchCustomerLookupService({ keyword: 'john', limit: 20 }, user);
 * // result = { items: [...], offset: 0, limit: 20, hasMore: true }
 */
const fetchCustomerLookupService = async (
  {
    keyword = '',
    limit = 50,
    offset = 0,
  },
  user
) => {
  try {
    if (limit < 1 || offset < 0) {
      throw AppError.validationError('Invalid pagination parameters.');
    }
    
    logSystemInfo('Fetching customer lookup from service', {
      context: 'lookup-service/fetchCustomerLookupService',
      metadata: { keyword, limit, offset },
    });
    
    const { statusId, overrideDefaultStatus } = await resolveCustomerQueryOptions(user);
    
    const rawResult = await getCustomerLookup({
      keyword,
      statusId,
      limit,
      offset,
      overrideDefaultStatus,
    });
    
    return transformCustomerPaginatedLookupResult(rawResult);
  } catch (err) {
    logSystemException(
      err,
      'Failed to fetch customer lookup in service',
      {
        context: 'lookup-service/fetchCustomerLookupService',
        keyword,
        limit,
        offset,
      }
    );
    
    throw AppError.serviceError(
      'Failed to fetch customer lookup list.',
      {
        details: err.message,
        stage: 'lookup-service/fetchCustomerLookupService',
      }
    );
  }
};

/**
 * Retrieves and transforms address records for a given customer,
 * including unassigned addresses if the customer has none.
 *
 * This service fetches lightweight address data optimized for lookup purposes,
 * such as dropdowns, selection lists, or quick UI previews. If the specified
 * customer does not have any assigned addresses, the service will include
 * globally unassigned addresses (`customer_id IS NULL`) as a fallback.
 *
 * A soft cap of 20 address records is enforced to prevent excessive payloads
 * and flag potential data integrity issues.
 *
 * Common use cases include:
 * - Sales order creation or editing
 * - Shipping/billing address selection
 * - Customer profile form or settings
 *
 * @param {string} customerId - The UUID of the customer for whom addresses are being retrieved
 * @returns {Promise<Array<Object>>} A promise resolving to an array of minimal, client-ready address objects
 *
 * @throws {AppError} Throws a service-level error if address retrieval or transformation fails
 */
const fetchCustomerAddressLookupService = async (customerId) => {
  try {
    // Step 1: Check if customer has any assigned addresses
    const hasAddresses = await hasAssignedAddresses(customerId);
    
    // Step 2: Fallback to unassigned addresses if none found
    const includeUnassigned = !hasAddresses;
    
    const rawRows = await getCustomerAddressLookupById({
      filters: { customerId },
      includeUnassigned,
    });
    
    if (rawRows.length > LOOKUPS.ADDRESSES.MAX_BY_CUSTOMER) {
      throw AppError.validationError(
        'Customer has too many addresses — possible data issue.'
      );
    }
    
    return transformCustomerAddressesLookupResult(rawRows);
  } catch (error) {
    throw AppError.serviceError('Unable to retrieve customer address lookup data.');
  }
};

/**
 * Fetches order types for dropdowns based on a user role, permission, and filters.
 *
 * - Applies permission-based filtering (e.g., restricts category or status).
 * - Returns minimal `{ id, name }` for restricted users.
 * - Full data for users with `view_order_type` permission.
 *
 * @param {Object} params
 * @param {Object} params.filters - Optional filter object (e.g. { keyword })
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Array>} Transformed lookup result
 */
const fetchOrderTypeLookupService = async ({ filters = {} }, user) => {
  try {
    const { keyword } = filters;
    
    // Step 1: Build filters based on user access
    const filteredQuery = await getFilteredOrderTypes(user, keyword);
    
    // Step 2: Fetch matching order types from DB
    const rawResult = await getOrderTypeLookup({ filters: filteredQuery });
    
    // Step 3: Restrict fields based on user permission
    const filteredResult = await filterOrderTypeLookupResultByPermission(user, rawResult);
    
    // Step 4: Transform result for lookup dropdown
    return transformOrderTypeLookupResult(filteredResult);
  } catch (error) {
    logSystemException(error, 'Failed to fetch order type lookup', {
      context: 'lookup-service/fetchOrderTypeLookupService',
      userId: user?.id,
      role: user?.role,
    });
    
    throw AppError.serviceError('Unable to fetch order type lookup');
  }
};

/**
 * Service function to retrieve a paginated and filtered list of payment methods
 * for dropdown or lookup components, with permission-aware filtering and transformation.
 *
 * @param {Object} user - Authenticated user object
 * @param {Object} options
 * @param {Object} [options.filters={}] - Query filters (e.g., keyword)
 * @param {number} [options.limit=50] - Number of records per page
 * @param {number} [options.offset=0] - Pagination offset
 * @returns {Promise<{ items: { label: string, value: string }[], hasMore: boolean }>}
 */
const fetchPaginatedPaymentMethodLookupService = async (user, {
  filters = {},
  limit = 50,
  offset = 0,
}) => {
  try {
    // 1. Enforce business-layer rules on filters (e.g., isActive, keyword scope)
    const adjustedFilters = await enforcePaymentMethodAccessControl(user, filters);
    
    // 2. Fetch raw-paginated records from repository
    const paginatedResult = await getPaymentMethodLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    // 3. Transform raw rows to UI-friendly format
    return transformPaymentMethodPaginatedLookupResult(paginatedResult);
  } catch (err) {
    logSystemException(err, 'Failed to fetch payment method lookup', {
      context: 'lookup-service/fetchPaginatedPaymentMethodLookupService',
      userId: user?.id,
      filters,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Unable to retrieve payment method lookup.');
  }
};

module.exports = {
  fetchBatchRegistryLookupService,
  fetchWarehouseLookupService,
  fetchLotAdjustmentLookupService,
  fetchCustomerLookupService,
  fetchCustomerAddressLookupService,
  fetchOrderTypeLookupService,
  fetchPaginatedPaymentMethodLookupService,
};
