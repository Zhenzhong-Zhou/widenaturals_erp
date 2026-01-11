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
  transformPricingPaginatedLookupResult,
  transformPackagingMaterialPaginatedLookupResult,
  transformSkuCodeBasePaginatedLookupResult,
  transformProductPaginatedLookupResult,
  transformStatusPaginatedLookupResult,
  transformUserPaginatedLookupResult,
} = require('../transformers/lookup-transformer');
const { logSystemInfo, logSystemException } = require('../utils/system-logger');
const {
  getLotAdjustmentTypeLookup,
} = require('../repositories/lot-adjustment-type-repository');
const { getCustomerLookup } = require('../repositories/customer-repository');
const {
  evaluateCustomerLookupAccessControl,
  enforceCustomerLookupVisibilityRules,
  enrichCustomerOption,
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
  evaluateOrderTypeLookupAccessControl,
  enforceOrderTypeLookupVisibilityRules,
  filterOrderTypeLookupQuery,
  enrichOrderTypeRow,
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
  enrichDiscountRow,
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
const {
  getDeliveryMethodsLookup,
} = require('../repositories/delivery-method-repository');
const {
  evaluateSkuFilterAccessControl,
  enforceSkuLookupVisibilityRules,
  filterSkuLookupQuery,
  enrichSkuRow,
} = require('../business/sku-business');
const { getSkuLookup } = require('../repositories/sku-repository');
const {
  evaluatePricingLookupAccessControl,
  enforcePricingLookupVisibilityRules,
  filterPricingLookupQuery,
  enrichPricingRow,
} = require('../business/pricing-business');
const { getPricingLookup } = require('../repositories/pricing-repository');
const {
  evaluatePackagingMaterialLookupAccessControl,
  enforcePackagingMaterialVisibilityRules,
  enrichPackagingMaterialOption,
} = require('../business/packaging-material-business');
const {
  getPackagingMaterialsForSalesOrderLookup,
} = require('../repositories/packaging-material-repository');
const {
  evaluateSkuCodeBaseLookupAccessControl,
  enforceSkuCodeBaseLookupVisibilityRules,
  enrichSkuCodeBaseOption,
} = require('../business/sku-code-base-business');
const {
  getSkuCodeBaseLookup,
} = require('../repositories/sku-code-base-repository');
const {
  evaluateProductLookupAccessControl,
  enforceProductLookupVisibilityRules,
  enrichProductOption,
} = require('../business/product-business');
const { getProductLookup } = require('../repositories/product-repository');
const {
  evaluateStatusLookupAccessControl,
  enforceStatusLookupVisibilityRules,
  enrichStatusLookupOption,
} = require('../business/status-business');
const { getStatusLookup } = require('../repositories/status-repository');
const {
  evaluateUserVisibilityAccessControl,
  applyUserLookupVisibilityRules,
  enrichUserLookupWithActiveFlag, evaluateUserLookupSearchCapabilities
} = require('../business/user-business');
const { getUserLookup } = require('../repositories/user-repository');

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
 * Fetches filtered and paginated customer records for use in lookup UIs
 * (e.g., dropdowns, autocomplete inputs, selection lists).
 *
 * This service supports:
 * - Keyword-based partial matching on fields like name, email, or phone number
 * - Limit-offset pagination
 * - Permission-aware status filtering (e.g., show only active customers for restricted users)
 * - UI enrichment (e.g., flags like `isActive`, `hasAddress`)
 *
 * Internally:
 * - Resolves the current user's permissions
 * - Enforces visibility rules based on permission context
 * - Delegates to a repository-level paginated query
 * - Enriches and transforms results into UI-friendly format
 *
 * @param {object} user - Authenticated user object (used to determine access level).
 * @param {object} options - Query options.
 * @param {object} [options.filters={}] - Optional filters (e.g., `keyword`, `createdBy`, `onlyWithAddress`, `statusId`, etc.).
 * @param {number} [options.limit=50] - Number of records to return (default is 50).
 * @param {number} [options.offset=0] - Number of records to skip for pagination (default is 0).
 *
 * @returns {Promise<{
 *   items: Array<{ id: string, label: string, isActive?: boolean, hasAddress?: boolean }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }>} - Transformed customer lookup data with pagination info.
 *
 * @throws {AppError} - If permissions are insufficient or query execution fails.
 *
 * @example
 * const result = await fetchCustomerLookupService(user, {
 *   filters: { keyword: 'john', onlyWithAddress: true },
 *   limit: 20,
 *   offset: 0,
 * });
 *
 * // result:
 * // {
 * //   items: [
 * //     { id: '123', label: 'John Doe', isActive: true, hasAddress: true },
 * //     ...
 * //   ],
 * //   offset: 0,
 * //   limit: 20,
 * //   hasMore: true
 * // }
 */
const fetchCustomerLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  try {
    // Step 1: Log the operation start
    logSystemInfo('Fetching customer lookup from service', {
      context: 'lookup-service/fetchCustomerLookupService',
      metadata: { filters, limit, offset },
    });

    // Step 2: Evaluate user access permissions
    const userAccess = await evaluateCustomerLookupAccessControl(user);
    const activeStatusId = getStatusId('customer_active');

    // Step 3: Apply visibility enforcement rules to filters
    const adjustedFilters = enforceCustomerLookupVisibilityRules(
      filters,
      userAccess,
      activeStatusId
    );

    // Step 4: Fetch paginated customer data
    const { data = [], pagination = {} } = await getCustomerLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });

    // Step 5: Enrich customer records for UI
    const enrichedRows = data.map((row) =>
      enrichCustomerOption(row, activeStatusId)
    );

    // Step 6: Format for client consumption
    return transformCustomerPaginatedLookupResult(
      { data: enrichedRows, pagination },
      userAccess
    );
  } catch (err) {
    logSystemException(err, 'Failed to fetch customer lookup in service', {
      context: 'lookup-service/fetchCustomerLookupService',
      userId: user?.id,
      filters,
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
 * Service: fetchOrderTypeLookupService
 *
 * Retrieves a paginated list of order types for use in dropdowns or lookup UIs,
 * applying both role-based and attribute-based access control.
 *
 * Workflow:
 *   1. Evaluate the user's access control flags via `evaluateOrderTypeLookupAccessControl`.
 *   2. Apply enforced visibility rules (categories, statuses, keywords) using `enforceOrderTypeLookupVisibilityRules`.
 *   3. Normalize and build DB query filters with `filterOrderTypeLookupQuery`.
 *   4. Fetch matching order type records from the database (`getOrderTypeLookup`).
 *   5. Enrich each row with UI flags (e.g., `isActive`).
 *   6. Transform the enriched rows into `{ label, value, isActive? }` objects for frontend consumption.
 *
 * Access control:
 *   - Category scope is determined by `accessibleCategories` from `evaluateOrderTypeLookupAccessControl`.
 *   - Status and keyword scope are restricted unless `canViewAllStatuses` or `canViewAllKeywords` are true.
 *   - Root users bypass all restrictions.
 *
 * @async
 * @param {import('@types/custom').User} user - Authenticated user object (must include `id` and permission context).
 * @param {object} options - Lookup query options.
 * @param {object} [options.filters={}] - Optional filter parameters (e.g., `{ keyword, category, statusId }`).
 * @returns {Promise<{
 *   items: { label: string, value: string, isActive?: boolean }[],
 *   hasMore: boolean
 * }>} A paginated set of dropdown-compatible order type options and a `hasMore` flag.
 *
 * @throws {AppError}
 *   - `serviceError` if the lookup fails due to DB errors, permission issues, or unexpected conditions.
 *
 * @example
 * const { items, hasMore } = await fetchOrderTypeLookupService(currentUser, {
 *   filters: { keyword: 'sales', category: 'sales' }
 * });
 * // items: [ { label: 'Sales Order', value: 'uuid', isActive: true }, ... ]
 */
const fetchOrderTypeLookupService = async (user, { filters = {} }) => {
  try {
    // Step 1: Evaluate user access control flags
    const userAccess = await evaluateOrderTypeLookupAccessControl(user, {
      action: 'VIEW',
    });
    const activeStatusId = getStatusId('order_type_active');

    // Step 2: Enforce filter visibility rules (e.g., restrict categories, status)
    const enforcedFilters = enforceOrderTypeLookupVisibilityRules(
      filters,
      userAccess,
      {
        activeStatusId,
      }
    );

    // Step 3: Build DB query filters (e.g., keyword ILIKE normalization)
    const finalQuery = filterOrderTypeLookupQuery(
      enforcedFilters,
      userAccess,
      activeStatusId
    );

    // Step 4: Fetch paginated raw DB records
    const rawResult = await getOrderTypeLookup({
      filters: finalQuery,
    });

    // Step 5: Enrich raw rows with UI flags (e.g., isActive)
    const enrichedRows = rawResult.map((row) =>
      enrichOrderTypeRow(row, activeStatusId)
    );

    // Step 6: Transform for dropdown-compatible output
    return transformOrderTypeLookupResult(enrichedRows, userAccess);
  } catch (err) {
    logSystemException(err, 'Failed to fetch order type lookup', {
      context: 'lookup-service/fetchOrderTypeLookupService',
      userId: user?.id,
      filters,
    });

    throw AppError.serviceError('Unable to fetch order type options');
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
    const adjustedFilters = enforcePaymentMethodLookupVisibilityRules(
      filters,
      userAccess
    );

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
    const permissionAdjustedFilters = enforceDiscountLookupVisibilityRules(
      filters,
      userAccess,
      activeStatusId
    );

    // Step 3: Apply domain-level filtering rules
    const fullyAdjustedFilters = filterDiscountLookupQuery(
      permissionAdjustedFilters,
      userAccess
    );

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
    return transformDiscountPaginatedLookupResult(
      {
        data: enrichedRows,
        pagination,
      },
      userAccess
    );
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
    const permissionAdjustedFilters = enforceTaxRateLookupVisibilityRules(
      filters,
      userAccess
    );

    // Step 3: Apply business-layer filtering
    const fullyAdjustedFilters = filterTaxRateLookupQuery(
      permissionAdjustedFilters,
      userAccess
    );

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
    return transformTaxRatePaginatedLookupResult(
      {
        data: enrichedRows,
        pagination,
      },
      userAccess
    );
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
    const permissionAdjustedFilters =
      enforceDeliveryMethodLookupVisibilityRules(
        filters,
        userAccess,
        activeStatusId
      );

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
    return transformDeliveryMethodPaginatedLookupResult(
      {
        data: enrichedRows,
        pagination,
      },
      userAccess
    );
  } catch (err) {
    logSystemException(err, 'Failed to fetch delivery method lookup', {
      context: 'lookup-service/fetchPaginatedDeliveryMethodLookupService',
      userId: user?.id,
      filters,
      limit,
      offset,
    });

    throw AppError.serviceError(
      'Unable to retrieve delivery method lookup options.',
      {
        cause: err,
      }
    );
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
    const enforcedOptions = enforceSkuLookupVisibilityRules(
      options,
      userAccess
    );

    // Step 4: Validate required status IDs if not showing all SKUs
    if (!enforcedOptions.allowAllSkus && !activeStatusId) {
      throw AppError.validationError(
        'activeStatusId is required when allowAllSkus is false'
      );
    }

    // Step 5: Filter query input based on user role and visibility rules
    const queryFilters = filterSkuLookupQuery(
      filters,
      userAccess,
      activeStatusId
    );

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
  { filters = {}, limit = 50, offset = 0, displayOptions = {} }
) => {
  try {
    // Step 1: Load status cache
    const activeStatusId = getStatusId('pricing_active');

    // Step 2: Evaluate access control
    const userAccess = await evaluatePricingLookupAccessControl(user);

    // Step 3: Apply visibility rules
    const adjustedFilters = enforcePricingLookupVisibilityRules(
      filters,
      userAccess,
      activeStatusId
    );

    // Step 4: Build final DB query filters
    const queryFilters = filterPricingLookupQuery(
      adjustedFilters,
      userAccess,
      activeStatusId
    );

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
      displayOptions
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

/**
 * Fetch paginated packaging-material lookup options for UI components
 * (dropdowns/autocomplete), with **permission-aware** and **mode-aware** behavior.
 *
 * Processing pipeline:
 *  1) Access control → resolve user permissions (archived, all statuses, hidden-for-sales).
 *  2) Role enforcement → narrow filters for restricted users (active-only + unarchived).
 *  3) Mode overlay:
 *     - "generic"       → only role-based enforcement.
 *     - "salesDropdown" → always force `visibleOnly`, `unarchived`, and `active` for EVERYONE
 *                         (even admins), to keep the dropdown deterministic.
 *  4) Repository query with limit/offset.
 *  5) Enrichment → add UI flags (e.g., `isActive`, `isArchived`).
 *  6) Transform → `{ items, hasMore, offset, limit }` for the client.
 *
 * Notes:
 * - The SQL builder should treat visibility as **opt-in**:
 *     if (filters.visibleOnly === true) { WHERE pm.is_visible_for_sales_order = true }
 * - We do NOT trust the client to pass `visibleOnly`; it’s derived server-side from `mode`.
 * - `mode` should be validated/defaulted at the request boundary (e.g., Joi default to "generic").
 *
 * @param {Object} user - Authenticated user (context for permission evaluation).
 * @param {Object} [options]
 * @param {Object} [options.filters={}] - Repository-level filters (e.g., keyword, statusId).
 * @param {number} [options.limit=50]   - Page size.
 * @param {number} [options.offset=0]   - Pagination offset.
 * @param {"generic"|"salesDropdown"} [options.mode="generic"] - Endpoint mode (validated upstream).
 *
 * @returns {Promise<{
 *   items: Array<{ id: string, label: string, isArchived?: boolean, isActive?: boolean }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }>}
 *
 * @throws {AppError} On permission evaluation failure, missing status id, repo or transform errors.
 *
 * @example
 * // Generic admin lookup (permission-aware)
 * const res = await fetchPaginatedPackagingMaterialLookupService(currentUser, {
 *   filters: { keyword: 'box' },
 *   limit: 20,
 *   offset: 0,
 *   mode: 'generic',
 * });
 *
 * @example
 * // Sales dropdown: visible-only; to *hard*-enforce active + unarchived for all users,
 * const res = await fetchPaginatedPackagingMaterialLookupService(currentUser, {
 *   filters: { keyword: 'label' },
 *   limit: 20,
 *   offset: 0,
 *   mode: 'salesDropdown',
 * });
 */
const fetchPaginatedPackagingMaterialLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0, mode = 'generic' } = {}
) => {
  try {
    const isSales = mode === 'salesDropdown';

    // 1) Access control (role capabilities)
    const userAccess = await evaluatePackagingMaterialLookupAccessControl(user);

    // 2) Resolve the "active" status id (used by enforcement + enrichment)
    const activeStatusId = getStatusId('packaging_material_active');

    // 3) Role-based enforcement first (keeps this function purely about permissions)
    let adjusted = enforcePackagingMaterialVisibilityRules(
      filters,
      userAccess,
      activeStatusId
    );

    // Make visibility explicit for readability/logging (builder only acts on === true)
    adjusted.visibleOnly = isSales;

    // 3b) Mode overlay: sales dropdown must always be curated (even for admins)
    if (isSales) {
      adjusted = {
        ...adjusted,
        restrictToUnarchived: true, // always exclude archived
        _activeStatusId: activeStatusId, // always active-only
      };
      delete adjusted.statusId; // prevent widening via caller-provided status
    }

    // 4) Repository query (offset-based pagination)
    // If this repo is sales-only, rename to a generic function; otherwise this is fine.
    const raw = await getPackagingMaterialsForSalesOrderLookup({
      filters: adjusted,
      limit,
      offset,
    });
    const { data = [], pagination = {} } = raw || {};

    // 5) Enrich rows with flags for the UI
    const enriched = data.map((row) =>
      enrichPackagingMaterialOption(row, activeStatusId)
    );

    // 6) Transform to client payload (items + hasMore + pagination)
    return transformPackagingMaterialPaginatedLookupResult(
      { data: enriched, pagination },
      userAccess
    );
  } catch (err) {
    // Include enough context for observability while avoiding PII where needed
    logSystemException(err, 'Failed to fetch packaging material lookup', {
      context: 'lookup-service/fetchPaginatedPackagingMaterialLookupService',
      userId: user?.id,
      filters,
      limit,
      offset,
      mode,
    });
    throw AppError.serviceError(
      'Unable to retrieve packaging material lookup options.',
      {
        cause: err,
        stage: 'fetchPaginatedPackagingMaterialLookupService',
      }
    );
  }
};

/**
 * Fetches filtered and paginated SKU Code Base records for lookup UIs
 * (e.g., dropdowns, autocomplete inputs, selection lists).
 *
 * Supports:
 * - Keyword-based matching on brand_code or category_code
 * - Limit-offset pagination
 * - Permission-aware status filtering (active-only for restricted users)
 * - UI enrichment (e.g., flags like `isActive`)
 *
 * Internal flow:
 * - Resolve user permissions
 * - Enforce visibility rules
 * - Perform repository-level lookup query
 * - Enrich each row
 * - Transform to UI-friendly format
 *
 * @param {object} user - Authenticated user object.
 * @param {object} options - Query options.
 * @param {object} [options.filters={}] - Optional filters (e.g., keyword, brand_code, category_code, status_id, etc.)
 * @param {number} [options.limit=50] - Maximum number of rows.
 * @param {number} [options.offset=0] - Offset for pagination.
 *
 * @returns {Promise<{
 *   items: Array<{ id: string, label: string, isActive?: boolean }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }>}
 *
 * @throws {AppError} - If permission or query execution fails.
 */
const fetchSkuCodeBaseLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  const context = 'lookup-service/fetchSkuCodeBaseLookupService';

  try {
    // Step 1: Log service entry
    logSystemInfo('Fetching SKU Code Base lookup from service', {
      context,
      metadata: { filters, limit, offset },
    });

    // Step 2: Evaluate permissions
    const userAccess = await evaluateSkuCodeBaseLookupAccessControl(user);
    const activeStatusId = getStatusId('general_active');

    // Step 3: Apply visibility enforcement
    const adjustedFilters = enforceSkuCodeBaseLookupVisibilityRules(
      filters,
      userAccess,
      activeStatusId
    );

    // Step 4: Fetch paginated rows from repository
    const { data = [], pagination = {} } = await getSkuCodeBaseLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });

    // Step 5: Enrich each code base row
    const enrichedRows = data.map((row) =>
      enrichSkuCodeBaseOption(row, activeStatusId)
    );

    // Step 6: Final UI-format result
    return transformSkuCodeBasePaginatedLookupResult(
      { data: enrichedRows, pagination },
      userAccess
    );
  } catch (err) {
    logSystemException(err, 'Failed to fetch SKU Code Base lookup in service', {
      context,
      userId: user?.id,
      filters,
      limit,
      offset,
    });

    throw AppError.serviceError('Failed to fetch SKU Code Base lookup list.', {
      details: err.message,
      stage: context,
    });
  }
};

/**
 * Fetches filtered and paginated Product records for lookup UI components
 * (dropdowns, autocomplete inputs, selection lists).
 *
 * Supports:
 * - Keyword-based fuzzy matching (name, brand, category, series)
 * - Pagination via limit + offset
 * - Permission-aware status filtering (active-only for restricted users)
 * - Row-level UI enrichment (e.g., `isActive` flag)
 *
 * Internal flow:
 * 1. Resolve user permissions
 * 2. Apply product visibility rules (active-only if required)
 * 3. Execute repository-level lookup query
 * 4. Enrich each product row with UI flags
 * 5. Transform into UI-optimized paginated structure
 *
 * @param {object} user - Authenticated user object.
 * @param {object} options - Lookup query options.
 * @param {object} [options.filters={}] - Optional product filters (keyword, brand, category, series, status_id).
 * @param {number} [options.limit=50] - Max number of items to return.
 * @param {number} [options.offset=0] - Pagination offset.
 *
 * @returns {Promise<{
 *   items: Array<{ id: string, label: string, isActive?: boolean }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }>}
 *
 * @throws {AppError} When permission evaluation or repository query fails.
 */
const fetchProductLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  const context = 'lookup-service/fetchProductLookupService';

  try {
    // Step 1: Log entry
    logSystemInfo('Fetching Product lookup from service', {
      context,
      metadata: { filters, limit, offset },
    });

    // Step 2: Permission evaluation
    const userAccess = await evaluateProductLookupAccessControl(user);
    const activeStatusId = getStatusId('general_active');

    // Step 3: Apply enforced visibility rules
    const adjustedFilters = enforceProductLookupVisibilityRules(
      filters,
      userAccess,
      activeStatusId
    );

    // Step 4: Query repository
    const { data = [], pagination = {} } = await getProductLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });

    // Step 5: Enrich rows (e.g., add isActive flag)
    const enrichedRows = data.map((row) =>
      enrichProductOption(row, activeStatusId)
    );

    // Step 6: Transform to UI-friendly paginated payload
    return transformProductPaginatedLookupResult(
      { data: enrichedRows, pagination },
      userAccess
    );
  } catch (err) {
    logSystemException(err, 'Failed to fetch Product lookup in service', {
      context,
      userId: user?.id,
      filters,
      limit,
      offset,
    });

    throw AppError.serviceError('Failed to fetch product lookup list.', {
      details: err.message,
      stage: context,
    });
  }
};

/**
 * Fetches filtered and paginated Status records for lookup UIs
 * (dropdowns, autocomplete lists, admin selection inputs).
 *
 * Supports:
 * - Keyword-based matching
 * - Limit-offset pagination
 * - Permission-aware active-only visibility for restricted users
 * - UI enrichment (e.g., `isActive` flag)
 *
 * Internal flow:
 * - Resolve user permissions
 * - Enforce visibility rules
 * - Perform repository lookup query
 * - Enrich each row
 * - Transform final UI output
 *
 * @param {object} user - Authenticated user object.
 * @param {object} options - Query options.
 * @param {object} [options.filters={}] - Optional filters (keyword, name, is_active, etc.)
 * @param {number} [options.limit=50] - Maximum rows to return.
 * @param {number} [options.offset=0] - Offset for pagination.
 *
 * @returns {Promise<{
 *   items: Array<{ id: string, label: string, isActive?: boolean }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }>}
 *
 * @throws {AppError} - If permission or lookup execution fails.
 */
const fetchStatusLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  const context = 'lookup-service/fetchStatusLookupService';

  try {
    // Step 1: Service entry logging
    logSystemInfo('Fetching Status lookup from service', {
      context,
      metadata: { filters, limit, offset },
    });

    // Step 2: Resolve user access level
    const userAccess = await evaluateStatusLookupAccessControl(user);

    // Step 3: Enforce visibility rules (active-only for restricted roles)
    const adjustedFilters = enforceStatusLookupVisibilityRules(
      filters,
      userAccess
    );

    // Step 4: Repository-level lookup
    const { data = [], pagination = {} } = await getStatusLookup({
      filters: adjustedFilters,
      limit,
      offset,
    });

    // Step 5: Enrich each row (add isActive flag, etc.)
    const enrichedRows = data.map((row) => enrichStatusLookupOption(row));

    // Step 6: Convert to UI-friendly format
    return transformStatusPaginatedLookupResult(
      { data: enrichedRows, pagination },
      userAccess
    );
  } catch (err) {
    logSystemException(err, 'Failed to fetch Status lookup in service', {
      context,
      userId: user?.id,
      filters,
      limit,
      offset,
    });

    throw AppError.serviceError('Failed to fetch Status lookup list.', {
      details: err.message,
      stage: context,
    });
  }
};

/**
 * Fetches a filtered, paginated list of Users for lookup UI components
 * such as dropdowns, autocomplete inputs, and assignment selectors.
 *
 * This service enforces **permission-aware visibility** and **search
 * capability constraints** before executing the repository lookup.
 *
 * ### Supported behavior
 * - Keyword-based fuzzy matching (name, email)
 * - Offset-based pagination
 * - SQL-authoritative visibility enforcement
 * - Conditional enrichment for UI-only flags
 *
 * ### Internal flow
 * 1. Resolve user visibility permissions (row-level access)
 * 2. Resolve lookup search capabilities (query-shaping access)
 * 3. Apply enforced visibility rules to incoming filters
 * 4. Execute repository-level lookup query
 * 5. Enrich rows with UI-only metadata when meaningful
 * 6. Transform into UI-optimized paginated response
 *
 * ### Notes
 * - Lookup queries are intentionally lightweight by default
 * - Role / status joins are enabled only when explicitly permitted
 * - `isActive` is included only when inactive users may be visible
 * - Active-only lookups omit `isActive` to keep payload minimal
 *
 * @param {Object} user
 *   Authenticated user context
 *
 * @param {Object} args
 * @param {Object} [args.filters={}]
 *   Optional row-level user filters (keyword, role, status, etc.)
 *
 * @param {number} [args.limit=50]
 *   Maximum number of records to return
 *
 * @param {number} [args.offset=0]
 *   Number of records to skip
 *
 * @returns {Promise<{
 *   items: Array<{
 *     id: string,
 *     label: string,
 *     subLabel?: string,
 *     isActive?: boolean
 *   }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }>}
 *
 * @throws {AppError}
 *   When permission evaluation or repository query fails
 */
const fetchUserLookupService = async (
  user,
  { filters = {}, limit = 50, offset = 0 }
) => {
  const context = 'lookup-service/fetchUserLookupService';
  
  try {
    // ---------------------------------------------------------
    // Step 1 — Log request entry
    // ---------------------------------------------------------
    logSystemInfo('Fetching User lookup from service', {
      context,
      metadata: { filters, limit, offset },
    });
    
    // ---------------------------------------------------------
    // Step 2 — Resolve user visibility permissions (row-level)
    // ---------------------------------------------------------
    const userAccess = await evaluateUserVisibilityAccessControl(user);
    const activeStatusId = getStatusId('general_active');
    
    // ---------------------------------------------------------
    // Step 3 — Resolve lookup search capabilities (query shaping)
    // ---------------------------------------------------------
    const searchCapabilities =
      await evaluateUserLookupSearchCapabilities(user);
    
    // ---------------------------------------------------------
    // Step 4 — Apply enforced visibility rules to filters
    // ---------------------------------------------------------
    const adjustedFilters = applyUserLookupVisibilityRules(
      filters,
      userAccess,
      activeStatusId
    );
    
    // ---------------------------------------------------------
    // Step 5 — Execute repository lookup query
    // ---------------------------------------------------------
    const { data = [], pagination = {} } = await getUserLookup({
      filters: adjustedFilters,
      options: searchCapabilities,
      limit,
      offset,
    });
    
    // ---------------------------------------------------------
    // Step 6 — Enrich rows with UI-only flags
    // Applied only when inactive users may be visible
    // ---------------------------------------------------------
    let enrichedRows = data;
    
    if (userAccess.canViewAllStatuses) {
      enrichedRows = data.map((row) =>
        enrichUserLookupWithActiveFlag(row, activeStatusId)
      );
    }
    
    // ---------------------------------------------------------
    // Step 7 — Transform into UI-friendly paginated payload
    // ---------------------------------------------------------
    return transformUserPaginatedLookupResult(
      { data: enrichedRows, pagination },
      userAccess
    );
  } catch (err) {
    logSystemException(err, 'Failed to fetch User lookup in service', {
      context,
      userId: user?.id,
      filters,
      limit,
      offset,
    });
    
    throw AppError.serviceError('Failed to fetch user lookup list.', {
      details: err.message,
      stage: context,
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
  fetchPaginatedPackagingMaterialLookupService,
  fetchSkuCodeBaseLookupService,
  fetchProductLookupService,
  fetchStatusLookupService,
  fetchUserLookupService,
};
