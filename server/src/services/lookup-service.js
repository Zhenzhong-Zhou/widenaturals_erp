const AppError = require('../utils/AppError');
const {
  getBatchRegistryLookup,
} = require('../repositories/batch-registry-repository');
const { getWarehouseLookup } = require('../repositories/warehouse-repository');
const {
  transformBatchRegistryPaginatedLookupResult,
  transformWarehouseLookupRows,
  transformLotAdjustmentLookupOptions,
  transformCustomerPaginatedLookupResult,
  transformCustomerAddressesLookupResult,
  transformOrderTypeLookupResult,
  transformPaymentMethodPaginatedLookupResult,
  transformDiscountPaginatedLookupResult,
  transformTaxRatePaginatedLookupResult,
  transformDeliveryMethodPaginatedLookupResult,
  transformSkuPaginatedLookupResult,
} = require('../transformers/lookup-transformer');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const {
  getLotAdjustmentTypeLookup,
} = require('../repositories/lot-adjustment-type-repository');
const { getCustomerLookup } = require('../repositories/customer-repository');
const {
  resolveCustomerQueryOptions,
} = require('../business/customer-business');
const {
  getCustomerAddressLookupById,
  hasAssignedAddresses,
} = require('../repositories/address-repository');
const LOOKUPS = require('../utils/constants/domain/lookup-constants');
const {
  resolveWarehouseFiltersByPermission,
} = require('../business/warehouse-business');
const {
  enforceExternalAccessPermission,
} = require('../business/lot-adjustment-type-business');
const { getOrderTypeLookup } = require('../repositories/order-type-repository');
const {
  getFilteredOrderTypes,
  filterOrderTypeLookupResultByPermission,
} = require('../business/order-type-business');
const {
  evaluatePaymentMethodLookupAccessControl,
  enforcePaymentMethodLookupVisibilityRules,
  enrichPaymentMethodOption,
} = require('../business/payment-method-business');
const {
  getPaymentMethodLookup,
} = require('../repositories/payment-method-repository');
const { getDiscountsLookup } = require('../repositories/discount-repository');
const {
  evaluateDiscountLookupAccessControl,
  filterDiscountLookupQuery,
  enforceDiscountLookupVisibilityRules,
  enrichDiscountRow
} = require('../business/discount-business');
const { getStatusId } = require('../config/status-cache');
const {
  evaluateTaxRateLookupAccessControl,
  enforceTaxRateLookupVisibilityRules,
  filterTaxRateLookupQuery,
  enrichTaxRateRow,
} = require('../business/tax-rate-business');
const { getTaxRatesLookup } = require('../repositories/tax-rate-repository');
const {
  evaluateDeliveryMethodLookupAccessControl,
  enforceDeliveryMethodLookupVisibilityRules,
  enrichDeliveryMethodRow,
} = require('../business/delivery-method-business');
const { getDeliveryMethodsLookup } = require('../repositories/delivery-method-repository');
const {
  evaluateSkuFilterAccessControl,
  enforceSkuLookupVisibilityRules,
  filterSkuLookupQuery, enrichSkuRow
} = require('../business/sku-business');
const { getSkuLookup } = require('../repositories/sku-repository');
const {
  evaluatePricingLookupAccessControl,
  enforcePricingLookupVisibilityRules,
  filterPricingLookupQuery,
  enrichPricingRow
} = require('../business/pricing-business');
const { getPricingLookup } = require('../repositories/pricing-repository');
const { transformPricingPaginatedLookupResult } = require('../transformers/pricing-transformer');

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

    throw AppError.serviceError('Failed to fetch batch registry lookup list.', {
      details: err.message,
      stage: 'lookup-service/fetchBatchRegistryLookupService',
    });
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
    const resolvedFilters = await resolveWarehouseFiltersByPermission(
      user,
      filters
    );

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
    logSystemException(
      error,
      'Failed to fetch and transform lot adjustment types',
      {
        context: 'lookup-service/fetchLotAdjustmentLookupService',
        userId: user?.id,
        filters,
      }
    );
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
  { keyword = '', limit = 50, offset = 0 },
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

    const { statusId, overrideDefaultStatus } =
      await resolveCustomerQueryOptions(user);

    const rawResult = await getCustomerLookup({
      keyword,
      statusId,
      limit,
      offset,
      overrideDefaultStatus,
    });

    return transformCustomerPaginatedLookupResult(rawResult);
  } catch (err) {
    logSystemException(err, 'Failed to fetch customer lookup in service', {
      context: 'lookup-service/fetchCustomerLookupService',
      keyword,
      limit,
      offset,
    });

    throw AppError.serviceError('Failed to fetch customer lookup list.', {
      details: err.message,
      stage: 'lookup-service/fetchCustomerLookupService',
    });
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
    throw AppError.serviceError(
      'Unable to retrieve customer address lookup data.'
    );
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
    const filteredResult = await filterOrderTypeLookupResultByPermission(
      user,
      rawResult
    );

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
 * Fetches a paginated list of payment methods for use in dropdowns or lookup UIs.
 *
 * This service:
 * - Evaluates user permissions to determine visibility scope (e.g., active-only filtering)
 * - Applies enforced filtering rules to restrict access where necessary
 * - Enriches rows with flags like `isDisabled` for UI state handling
 * - Transforms raw DB records into `{ label, value }` format for frontend components
 *
 * @param {import('@types/custom').User} user - Authenticated user object (must contain ID and permission context)
 * @param {Object} options - Lookup query options
 * @param {Object} [options.filters={}] - Optional filter parameters (e.g., keyword, isActive)
 * @param {number} [options.limit=50] - Number of records to return
 * @param {number} [options.offset=0] - Record offset for pagination
 * @returns {Promise<{ items: { label: string, value: string, isDisabled?: boolean }[], hasMore: boolean }>}
 *   Transformed paginated result suitable for lookup/autocomplete components.
 *
 * @throws {AppError} When lookup fails due to service error or permission issues.
 */
const fetchPaginatedPaymentMethodLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  try {
    // Step 1: Evaluate user access control flags
    const userAccess = await evaluatePaymentMethodLookupAccessControl(user);
    
    // Step 2: Enforce visibility restrictions based on access level
    const adjustedFilters = enforcePaymentMethodLookupVisibilityRules(filters, userAccess);
    
    // Step 3: Fetch raw paginated payment method records
    const { data = [], pagination = {} } = await getPaymentMethodLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });
    
    // Step 4: Enrich each row with status-related flags for UI logic
    const enrichedRows = data.map(enrichPaymentMethodOption);
    
    // Step 5: Transform for dropdown-compatible output
    return transformPaymentMethodPaginatedLookupResult(
      { data: enrichedRows, pagination },
      userAccess
    );
  } catch (err) {
    logSystemException(err, 'Failed to fetch paginated payment method lookup', {
      context: 'lookup-service/fetchPaginatedPaymentMethodLookupService',
      userId: user?.id,
      filters,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Unable to fetch payment method options.');
  }
};

/**
 * Service function to fetch paginated discount lookup options.
 *
 * Applies the following processing steps:
 * - Evaluates the user's access permissions (e.g., view all statuses or valid discounts)
 * - Applies permission-based visibility rules to filters (e.g., restrict keyword search)
 * - Applies business-layer filtering (e.g., exclude archived or inactive discounts)
 * - Queries the repository for matching records with pagination
 * - Enriches raw rows with `isActive` and `isValidToday` flags
 * - Transforms enriched rows into UI-ready `{ label, value, isActive, isValidToday }` format
 *
 * @param {Object} user - Authenticated user object (must contain access context).
 * @param {Object} options - Lookup query options.
 * @param {Object} [options.filters={}] - Optional filter conditions (e.g., keyword, statusId).
 * @param {number} [options.limit=50] - Max number of records to return.
 * @param {number} [options.offset=0] - Number of records to skip for pagination.
 *
 * @returns {Promise<{ items: { label: string, value: string, isActive?: boolean, isValidToday?: boolean }[], hasMore: boolean }>}
 * Returns a list of formatted discount options and pagination metadata.
 *
 * @throws {AppError} Throws a service-level error if lookup fails.
 */
const fetchPaginatedDiscountLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  try {
    // Step 1: Evaluate user access rights
    const userAccess = await evaluateDiscountLookupAccessControl(user);
    const activeStatusId = getStatusId('discount_active');
  
    // Step 2: Apply permission-based visibility rules
    const permissionAdjustedFilters = enforceDiscountLookupVisibilityRules(filters, userAccess, activeStatusId);
    
    // Step 3: Apply domain-level filtering rules
    const fullyAdjustedFilters = filterDiscountLookupQuery(permissionAdjustedFilters, userAccess);
    
    // Step 4: Query the repository
    const rawResult = await getDiscountsLookup({
      filters: fullyAdjustedFilters,
      limit,
      offset,
    });
    
    const { data = [], pagination = {} } = rawResult;
    
    // Step 5: Enrich each row with computed flags
    const enrichedRows = data.map((row) =>
      enrichDiscountRow(row, activeStatusId)
    );
    
    // Step 6: Transform to client format
    return transformDiscountPaginatedLookupResult({
      data: enrichedRows,
      pagination,
    }, userAccess);
  } catch (err) {
    logSystemException(err, 'Failed to fetch discount lookup', {
      context: 'lookup-service/fetchPaginatedDiscountLookupService',
      userId: user?.id,
      filters,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Unable to retrieve discount lookup options.', {
      cause: err,
    });
  }
};

/**
 * Service function to fetch paginated tax rate lookup options.
 *
 * Applies the following processing steps:
 * - Evaluates user's access permissions (e.g., view all validity or active-only)
 * - Applies permission-based visibility rules to filters (e.g., restrict keyword search)
 * - Applies domain-level filtering (e.g., current validity, active status)
 * - Queries the repository for matching records with pagination
 * - Enriches raw rows with `isValidToday` flag
 * - Transforms enriched rows into UI-ready `{ label, value, isActive, isValidToday }` format
 *
 * @param {Object} user - Authenticated user object (must contain access context).
 * @param {Object} options - Lookup query options.
 * @param {Object} [options.filters={}] - Optional filter conditions (e.g., keyword, isActive).
 * @param {number} [options.limit=50] - Max number of records to return.
 * @param {number} [options.offset=0] - Number of records to skip for pagination.
 *
 * @returns {Promise<{ items: { label: string, value: string, isActive?: boolean, isValidToday?: boolean }[], hasMore: boolean }>}
 * Returns a list of formatted tax rate options and pagination metadata.
 *
 * @throws {AppError} Throws a service-level error if lookup fails.
 */
const fetchPaginatedTaxRateLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  try {
    // Step 1: Evaluate user access rights
    const userAccess = await evaluateTaxRateLookupAccessControl(user);
    
    // Step 2: Apply permission-based visibility rules
    const permissionAdjustedFilters = enforceTaxRateLookupVisibilityRules(filters, userAccess);
    
    // Step 3: Apply business-layer filtering
    const fullyAdjustedFilters = filterTaxRateLookupQuery(permissionAdjustedFilters, userAccess);
    
    // Step 4: Query the repository
    const rawResult = await getTaxRatesLookup({
      filters: fullyAdjustedFilters,
      limit,
      offset,
    });
    
    const { data = [], pagination = {} } = rawResult;
    
    // Step 5: Enrich each row
    const enrichedRows = data.map(enrichTaxRateRow);
    
    // Step 6: Transform to client format
    return transformTaxRatePaginatedLookupResult({
      data: enrichedRows,
      pagination,
    }, userAccess);
  } catch (err) {
    logSystemException(err, 'Failed to fetch tax rate lookup', {
      context: 'lookup-service/fetchPaginatedTaxRateLookupService',
      userId: user?.id,
      filters,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Unable to retrieve tax rate lookup options.', {
      cause: err,
    });
  }
};

/**
 * Service function to fetch paginated delivery method lookup options.
 *
 * Applies the following processing steps:
 * 1. Evaluate the user's access permissions (e.g., view all statuses)
 * 2. Applies permission-based visibility rules to filters (e.g., inject `_activeStatusId`)
 * 3. Queries the repository for matching records with pagination
 * 4. Enriches raw rows with `isActive` and `isPickupLocation` flags
 * 5. Transforms enriched rows into UI-ready format `{ label, value, isActive?, isPickupLocation? }`
 *
 * @param {Object} user - Authenticated user object (must contain access context).
 * @param {Object} options - Lookup query options.
 * @param {Object} [options.filters={}] - Optional filter conditions (e.g., keyword, statusId).
 * @param {number} [options.limit=50] - Max number of records to return.
 * @param {number} [options.offset=0] - Number of records to skip for pagination.
 *
 * @returns {Promise<{
 *   items: {
 *     label: string,
 *     value: string,
 *     isActive?: boolean,
 *     isPickupLocation?: boolean
 *   }[],
 *   hasMore: boolean
 * }>}
 * Returns a list of formatted delivery method options and pagination metadata.
 *
 * @throws {AppError} Throws a service-level error if lookup fails.
 */
const fetchPaginatedDeliveryMethodLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  try {
    // Step 1: Evaluate user access rights
    const userAccess = await evaluateDeliveryMethodLookupAccessControl(user);
    const activeStatusId = getStatusId('delivery_method_active');
    
    // Step 2: Apply permission-based visibility rules
    const permissionAdjustedFilters = enforceDeliveryMethodLookupVisibilityRules(filters, userAccess, activeStatusId);
    
    // Step 3: Query the repository
    const rawResult = await getDeliveryMethodsLookup({
      filters: permissionAdjustedFilters,
      limit,
      offset,
    });
    
    const { data = [], pagination = {} } = rawResult;
    
    // Step 4: Enrich rows with computed flags
    const enrichedRows = data.map((row) =>
      enrichDeliveryMethodRow(row, activeStatusId)
    );
    
    // Step 5: Transform to client format
    return transformDeliveryMethodPaginatedLookupResult({
      data: enrichedRows,
      pagination,
    }, userAccess);
  } catch (err) {
    logSystemException(err, 'Failed to fetch delivery method lookup', {
      context: 'lookup-service/fetchPaginatedDeliveryMethodLookupService',
      userId: user?.id,
      filters,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Unable to retrieve delivery method lookup options.', {
      cause: err,
    });
  }
};

/**
 * Service function to fetch paginated SKU lookup options for use in sales, inventory,
 * or internal order flows.
 *
 * This service performs the following steps:
 * 1. Loads expected status IDs used for filtering (SKU, product, inventory, batch).
 * 2. Evaluate the user's access control context (e.g., admin, internal, backorder).
 * 3. Applies visibility rules based on permissions (e.g., allow inactive/out-of-stock SKUs).
 * 4. Builds stock/status-based query filters unless `allowAllSkus` is enabled.
 * 5. Queries the repository for matching SKU records with pagination support.
 * 6. Enriches rows with computed status flags (e.g., `isNormal`, `issueReasons`).
 * 7. Transforms enriched rows into simplified dropdown format: `{ id, label, ...flags }`.
 *
 * @param {Object} user - Authenticated user object (must include permission context).
 * @param {Object} params - Query parameters and options.
 * @param {Object} [params.filters={}] - Optional filtering (e.g., keyword, brand, status).
 * @param {Object} [params.options={}] - Visibility/permission flags (e.g., allowAllSkus).
 * @param {number} [params.limit=50] - Max number of records to return.
 * @param {number} [params.offset=0] - Number of records to skip for pagination.
 *
 * @returns {Promise<{
 *   items: { id: string, label: string, isAbnormal?: boolean, abnormalReasons?: string[] }[],
 *   hasMore: boolean
 * }>} - Transformed SKU options with pagination and conditional flags.
 *
 * @throws {AppError} - Throws if SKU lookup fails or required status IDs are missing.
 */
const fetchPaginatedSkuLookupService = async (
  user,
  { filters = {}, options = {}, limit = 50, offset = 0 }
) => {
  try {
    const { includeBarcode = false } = options || {};
    
    // Step 1: Load expected status IDs for validation logic
    const activeStatusId = getStatusId('product_active'); // Used for both product & SKU
    const inventoryStatusId = getStatusId('inventory_in_stock'); // Shared for warehouse and location inventory
    const batchStatusId = getStatusId('batch_active');
    
    // Step 2: Evaluate user access control (permissions, overrides)
    const userAccess = await evaluateSkuFilterAccessControl(user);
    
    // Step 3: Apply permission-based visibility rules
    const enforcedOptions = enforceSkuLookupVisibilityRules(options, userAccess);
    
    // Step 4: Validate required status IDs if not showing all SKUs
    if (!enforcedOptions.allowAllSkus && !activeStatusId) {
      throw AppError.validationError(
        'activeStatusId is required when allowAllSkus is false'
      );
    }
    
    // Step 5: Filter query input based on user role and visibility rules
    const queryFilters = filterSkuLookupQuery(filters, userAccess);
    
    // Step 6: Execute the query to fetch raw SKU records
    const rawResult = await getSkuLookup({
      productStatusId: activeStatusId,
      filters: queryFilters,
      options: enforcedOptions,
      limit,
      offset,
    });
    
    const { data = [], pagination = {} } = rawResult;
    
    // Step 7: Add status flags (e.g., isNormal) to each row
    const expectedStatusIds = {
      sku: activeStatusId,
      product: activeStatusId,
      warehouse: inventoryStatusId,
      location: inventoryStatusId,
      batch: batchStatusId,
    };
    
    const enrichedRows = data.map((row) =>
      enrichSkuRow(row, expectedStatusIds)
    );
    
    // Step 8: Transform into dropdown-compatible shape
    return transformSkuPaginatedLookupResult(
      { data: enrichedRows, pagination },
      { includeBarcode },
      userAccess
    );
  } catch (err) {
    logSystemException(err, 'Failed to fetch SKU lookup', {
      context: 'lookup-service/fetchPaginatedSkuLookupService',
      userId: user?.id,
      filters,
      options,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Unable to retrieve SKU lookup options.', {
      cause: err,
    });
  }
};

/**
 * Service function to fetch paginated pricing lookup options
 * for use in sales order creation, inventory management, or admin pricing selectors.
 *
 * This service performs the following steps:
 * 1. Loads the expected active pricing status ID.
 * 2. Evaluate the user's access control context (e.g., admin or restricted access).
 * 3. Applies permission-based visibility rules (e.g., restrict to active or currently valid pricing).
 * 4. Constructs pricing filters, optionally using keyword-based search.
 * 5. Queries the pricing repository with pagination support.
 * 6. Enriches pricing rows with computed flags (e.g., `isActive`, `isValidToday`).
 * 7. Transforms results into dropdown-compatible format using display configuration.
 *
 * This function supports two modes:
 * - **Sales Order Context**: expects a `skuId` only; filters to valid prices for the SKU.
 * - **Admin Search Context**: accepts broader filters (brand, pricingType, etc.) and a `keyword`.
 *
 * @param {Object} user - Authenticated user object (must include permission context)
 * @param {Object} params - Request parameters
 * @param {Object} [params.filters={}] - Filter options (e.g., skuId, priceTypeId, brand, etc.)
 * @param {string} [params.keyword] - Optional keyword for fuzzy matching (product name, SKU, price type)
 * @param {number} [params.limit=50] - Maximum number of records to return
 * @param {number} [params.offset=0] - Number of records to skip (for pagination)
 * @param {Object} [params.displayOptions={}] - Controls label formatting (e.g., hide SKU in label)
 *
 * @returns {Promise<{ items: any[], hasMore: boolean }>} Transformed pricing options with pagination
 *
 * @throws {AppError} If required filters are missing or lookup fails
 */
const fetchPaginatedPricingLookupService = async (
  user,
  { filters = {}, keyword= '', limit = 50, offset = 0, displayOptions = {} }
) => {
  try {
    // Step 1: Load status cache
    const activeStatusId = getStatusId('pricing_active');
    
    // Step 2: Evaluate access control
    const userAccess = await evaluatePricingLookupAccessControl(user);
    
    // Step 3: Apply visibility rules
    const adjustedFilters = enforcePricingLookupVisibilityRules(
      filters,
      keyword, // no keyword in sales order
      userAccess,
      activeStatusId
    );
    
    // Step 4: Build final DB query filters
    const queryFilters = filterPricingLookupQuery(adjustedFilters, userAccess, activeStatusId);
    
    // Step 5: Fetch from DB
    const rawResult = await getPricingLookup({
      filters: queryFilters,
      limit,
      offset,
    });
    
    const { data = [], pagination = {} } = rawResult;
    
    // Step 6: Enrich rows with computed flags
    const enrichedRows = data.map((row) =>
      enrichPricingRow(row, activeStatusId)
    );
    
    // Step 7: Transform for dropdown
    return transformPricingPaginatedLookupResult(
      { data: enrichedRows, pagination },
      userAccess,
      {
        ...displayOptions,
        showSku: false,
        showLocation: false,
      }
    );
  } catch (err) {
    logSystemException(err, 'Failed to fetch pricing lookup', {
      context: 'lookup-service/fetchPaginatedPricingLookupService',
      userId: user?.id,
      filters,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Unable to retrieve pricing lookup options.', {
      cause: err,
    });
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
  fetchPaginatedDiscountLookupService,
  fetchPaginatedTaxRateLookupService,
  fetchPaginatedDeliveryMethodLookupService,
  fetchPaginatedSkuLookupService,
  fetchPaginatedPricingLookupService,
};
