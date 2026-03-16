const wrapAsync = require('../utils/wrap-async');
const {
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
  fetchRoleLookupService,
  fetchManufacturerLookupService,
  fetchSupplierLookupService,
  fetchLocationTypeLookupService,
  fetchBatchStatusLookupService,
  fetchPackagingMaterialSupplierLookupService,
} = require('../services/lookup-service');
const { logInfo } = require('../utils/logger-helper');
const { getClientIp } = require('../utils/request-context');
const { createLookupController } = require('./factories/lookup-controller-factory');

/**
 * Controller to handle batch registry lookup requests.
 * Supports query params for filtering, pagination, and inventory exclusion scoped to warehouse or location.
 *
 * @route GET /lookups/batch-registry
 * @query {string} [batchType] - 'product' or 'packaging_material'
 * @query {string} [warehouseId] - Optional warehouse ID to exclude batches already present in that warehouse
 * @query {string} [locationId] - Optional location ID to exclude batches already present in that location
 * @query {number} [limit=50] - Pagination limit
 * @query {number} [offset=0] - Pagination offset
 */
const getBatchRegistryLookupController = wrapAsync(async (req, res) => {
  logInfo('Incoming request for batch registry lookup', req, {
    context: 'lookup-controller/getBatchRegistryLookup',
    metadata: {
      query: req.query,
      user: req.auth.user?.id,
      ip: getClientIp(req),
    },
  });

  const { limit, offset, filters: rawFilters = {} } = req.normalizedQuery;

  const {
    batchType,
    warehouseId,
    locationId,
    ...restFilters // in case there are more filters later
  } = rawFilters;

  const filters = {
    ...(batchType !== undefined && { batchType }),
    ...(warehouseId !== undefined && { warehouseId }),
    ...(locationId !== undefined && { locationId }),
    ...restFilters, // optional: include any other filters dynamically
  };

  const dropdownResult = await fetchBatchRegistryLookupService({
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  res.status(200).json({
    success: true,
    message: `Successfully retrieved batch registry lookup`,
    items,
    limit,
    offset,
    hasMore,
  });
});

/**
 * Controller to fetch a filtered warehouse lookup list.
 * Accepts optional query parameters: locationTypeId, warehouseTypeId, includeArchived.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @returns {Promise<void>}
 */
const getWarehouseLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { warehouseTypeId } = req.normalizedQuery.filters ?? {};

  const filters = {
    ...(warehouseTypeId !== undefined && { warehouseTypeId }),
  };

  const dropdownItems = await fetchWarehouseLookupService(user, filters);

  res.status(200).json({
    success: true,
    message: `Successfully retrieved warehouses lookup`,
    data: dropdownItems,
  });
});

/**
 * Handles HTTP GET requests to retrieve lot adjustment type options for lookup purposes.
 *
 * Supports optional query parameter `excludeInternal=true` to filter out internal-only types
 * such as `'manual_stock_insert'` and `'manual_stock_update'`.
 *
 * @route GET /lookups/lot-adjustment-types
 * @query {boolean} [excludeInternal=true] - Whether to exclude internal-use adjustment types.
 * @returns {200} JSON array of lot adjustment type options, each containing:
 * - `value`: lot adjustment type ID,
 * - `label`: display name,
 * - `actionTypeId`: associated inventory action type ID.
 */
const getLotAdjustmentLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const filters = ({ excludeInternal, restrictToQtyAdjustment } =
    req.normalizedQuery.filters);

  const options = await fetchLotAdjustmentLookupService(user, filters);

  res.status(200).json({
    success: true,
    message: `Successfully retrieved lot adjustment lookup`,
    data: options,
  });
});

/**
 * Controller to handle customer lookup requests for dropdown/autocomplete.
 *
 * This controller receives query parameters (keyword, limit, offset),
 * delegates to the service layer, and responds with transformed lookup data.
 *
 * @param {import('express').Request} req - Express a request object containing query params.
 * @param {import('express').Response} res - Express response object used to return JSON response.
 *
 * @returns {Promise<void>} Sends JSON response with customer lookup data.
 */
const fetchCustomerLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit, offset } = req.normalizedQuery;
  const { keyword = '' } = filters;

  const dropdownResult = await fetchCustomerLookupService(user, {
    keyword,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  res.status(200).json({
    success: true,
    message: 'Customer address lookup data retrieved successfully.',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller to handle HTTP GET request for fetching customer address lookup data.
 *
 * This endpoint retrieves a list of simplified, active addresses associated
 * with the provided `customerId` (passed as a query parameter). It returns
 * minimal address objects optimized for client-side selection or display.
 *
 * Common use cases include:
 * - Sales order creation
 * - Shipping/billing address selection
 * - Customer profile dropdowns
 *
 * Expected query parameter:
 *   - customerId (string, required): UUID of the customer
 *
 * @route GET /addresses/by-customer?customerId={UUID}
 * @access Protected
 * @permission view_customer - Required to access customer address data
 *
 * @returns {200} JSON response containing the transformed lookup address list
 * @throws {400} If `customerId` is missing or too many addresses exist
 * @throws {500} If address retrieval or transformation fails
 */
const getCustomerAddressLookupController = wrapAsync(async (req, res) => {
  const customerId = req.query.customerId;

  const addresses = await fetchCustomerAddressLookupService(customerId);

  res.status(200).json({
    success: true,
    message: 'Customer address lookup data retrieved successfully.',
    data: addresses,
  });
});

/**
 * Controller to handle order type lookup requests for dropdown components.
 *
 * Responsibilities:
 * - Extract the authenticated user and normalized query parameters.
 * - Pass filters to the service layer for permission-aware lookup processing.
 * - Return a paginated list of order type options formatted for UI dropdowns.
 *
 * Example request:
 *   GET /api/lookup/order-types?keyword=transfer
 *
 * Query parameters (from `req.normalizedQuery`):
 * - filters: optional search filters (e.g. keyword, category)
 * - limit: maximum number of records to return
 * - offset: pagination offset
 *
 * Response structure:
 * {
 *   success: boolean,
 *   message: string,
 *   items: OrderTypeLookupItem[],
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }
 *
 * @async
 * @function
 * @param {import('express').Request} req
 *   Express request object containing:
 *   - `req.auth.user` authenticated user
 *   - `req.normalizedQuery` normalized query parameters
 *
 * @param {import('express').Response} res
 *   Express response object used to send the JSON response
 *
 * @returns {Promise<void>}
 */
const getOrderTypeLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;
  
  const dropdownResult = await fetchOrderTypeLookupService(user, {
    filters,
    limit,
    offset,
  });
  
  const { items, hasMore } = dropdownResult;
  
  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved order type lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller to handle GET /lookups/payment-methods
 *
 * Retrieves a paginated and optionally filtered list of active payment methods,
 * transformed for use in dropdown or autocomplete components.
 *
 * Query Parameters (via req.normalizedQuery):
 * @param {string} [keyword] - Optional search term to match name (and code if permitted).
 * @param {number} [limit=50] - Number of records to return (pagination limit).
 * @param {number} [offset=0] - Number of records to skip (pagination offset).
 *
 * Response Format:
 * {
 *   success: true,
 *   message: 'Successfully retrieved payment method lookup',
 *   data: {
 *     items: [{ label: string, value: string }],
 *     hasMore: boolean
 *   }
 * }
 *
 * Access Control:
 * - Requires authenticated user (req.auth.user)
 * - Results and filtering may be adjusted based on permissions (e.g., view_all_payment_methods, view_payment_code)
 */
const getPaymentMethodLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchPaginatedPaymentMethodLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  res.status(200).json({
    success: true,
    message: 'Successfully retrieved payment method lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated discount lookup options.
 *
 * This controller:
 * - Enforces access control via service-layer permissions.
 * - Applies visibility filters (e.g., restrict to active/valid records).
 * - Handles pagination via `limit` and `offset` query parameters.
 * - Returns results formatted for dropdown usage, including flags.
 *
 * Expected query structure (via `req.normalizedQuery`):
 * - filters: Optional object (e.g., { keyword, statusId })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/discounts
 * @access Protected
 * @permission `view_discount_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Express a request object containing user and normalizedQuery
 * @param {Express.Response} res - Express response object used to send JSON response
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{
 *      id: string,
 *      label: string,
 *      isActive: boolean,
 *      isValidToday: boolean
 *    }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getDiscountLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchPaginatedDiscountLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved discount lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated tax rate lookup options.
 *
 * This controller:
 * - Enforces access control via service-layer permissions.
 * - Applies visibility filters (e.g., restrict to active/valid records).
 * - Handles pagination via `limit` and `offset` query parameters.
 * - Returns results formatted for dropdown usage, including flags.
 *
 * Expected query structure (via `req.normalizedQuery`):
 * - filters: Optional object (e.g., { keyword, isActive })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/tax-rates
 * @access Protected
 * @permission `view_tax_rate_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Express a request object containing user and normalizedQuery
 * @param {Express.Response} res - Express response object used to send JSON response
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{
 *      id: string,
 *      label: string,
 *      isActive: boolean,
 *      isValidToday: boolean
 *    }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getTaxRateLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchPaginatedTaxRateLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved tax rate lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated delivery method lookup options.
 *
 * This controller:
 * - Enforces access control via service-layer permissions.
 * - Applies visibility filters (e.g., restrict to active records).
 * - Handles pagination via `limit` and `offset` query parameters.
 * - Returns results formatted for dropdown usage, including optional flags.
 *
 * Expected query structure (via `req.normalizedQuery`):
 * - filters: Optional object (e.g., { keyword, isPickupLocation })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/delivery-methods
 * @access Protected
 * @permission `view_delivery_method_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Express a request object containing user and normalizedQuery
 * @param {Express.Response} res - Express response object used to send JSON response
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{
 *      id: string,
 *      label: string,
 *      isPickupLocation?: boolean,
 *      isActive?: boolean
 *    }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getDeliveryMethodLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchPaginatedDeliveryMethodLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved delivery method lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated SKU lookup options.
 *
 * This controller:
 * - Enforces access control via service-layer permissions.
 * - Applies visibility filters (e.g., restrict to in-stock/active SKUs based on user access).
 * - Handles pagination via `limit` and `offset` query parameters.
 * - Supports optional label formatting (e.g., include barcode).
 * - Returns results formatted for dropdown usage.
 *
 * Expected query structure (via `req.normalizedQuery`):
 * - filters: Optional object (e.g., { keyword, brand, category, statusId })
 * - options: Optional object (e.g., { includeBarcode, requireAvailableStock })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/skus
 * @access Protected
 * @permission `view_sku_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Express a request object containing user and normalizedQuery
 * @param {Express.Response} res - Express response object used to send JSON response
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{
 *      id: string,
 *      label: string
 *    }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getSkuLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const {
    filters = {},
    options = {},
    limit = 50,
    offset = 0,
  } = req.normalizedQuery;

  const dropdownResult = await fetchPaginatedSkuLookupService(user, {
    filters,
    options,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved SKU lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated pricing lookup options.
 *
 * This controller:
 * - Enforces access control via service-layer permissions.
 * - Applies visibility rules (e.g., restrict to active or currently valid pricing).
 * - Handles pagination via `limit` and `offset` query parameters.
 * - Supports both direct SKU-based pricing (e.g., for order creation)
 *   and broader search-based pricing (e.g., for admin or catalog use).
 * - Accepts a `labelOnly` flag via `options` to return minimal dropdown rows (`{ id, label }` only).
 * - Returns pricing options formatted for dropdown usage.
 *
 * Expected query structure (via `req.normalizedQuery`):
 * - `filters`: Object containing filter criteria (e.g., `{ skuId, priceTypeId, brand, statusId }`)
 * - `keyword`: Optional fuzzy search string (applies to product name, SKU, or pricing type)
 * - `limit`: Optional number for pagination (default: 50)
 * - `offset`: Optional pagination offset (default: 0)
 * - `options`: Optional object to control display behavior
 *    - `labelOnly`: Boolean flag to return only `{ id, label }` for dropdown use
 *
 * Behavior:
 * - If `filters.skuId` is specified, the SKU label is omitted for brevity.
 * - If `options.labelOnly` is true, only minimal fields are returned per item.
 *
 * @route GET /lookups/pricing
 * @access Protected
 * @permission `view_pricing_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Express request object with `user` and `normalizedQuery`
 * @param {Express.Response} res - Express response object
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{
 *      id: string,
 *      label: string,
 *      [price]?: string | number,
 *      [pricingTypeName]?: string,
 *      [locationName]?: string,
 *      [isActive]?: boolean,
 *      [isValidToday]?: boolean
 *    }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getPricingLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const {
    filters = {},
    options = {},
    limit = 50,
    offset = 0,
  } = req.normalizedQuery;

  const dropdownResult = await fetchPaginatedPricingLookupService(user, {
    filters,
    limit,
    offset,
    displayOptions: {
      showSku: !filters?.skuId, // Hide SKU in label if SKU is already specified
      labelOnly: options.labelOnly,
    },
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved pricing lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated packaging-material lookup options.
 *
 * Responsibilities:
 * - Delegates access control & visibility enforcement to the service layer.
 * - Supports a stricter "salesDropdown" mode that sets `visibleOnly` and may hard-enforce
 *   active-only + unarchived depending on your service/builder rules.
 * - Handles pagination via `limit` and `offset`.
 * - Returns data formatted for dropdown/autocomplete usage.
 *
 * Expected normalized query (via `req.normalizedQuery`):
 * - filters?: object            // e.g., { keyword, statusId, createdBy, updatedBy, restrictToUnarchived }
 * - options?: {
 *     mode?: 'generic' | 'salesDropdown', // route behavior, default 'generic'
 *     labelOnly?: boolean
 *   }
 * - limit?: number = 50
 * - offset?: number = 0
 *
 * @route GET /lookups/packaging-materials
 * @access Protected
 * @permission view_packaging_material_lookup (enforced in service layer)
 *
 * @param {import('express').Request} req  - Express request (expects `req.auth.user` and `req.normalizedQuery`)
 * @param {import('express').Response} res - Express response
 * @returns {Promise<void>} Sends JSON:
 *  {
 *    success: true,
 *    message: "Successfully retrieved packaging material lookup",
 *    items: Array<{ id: string, label: string, isActive?: boolean, isArchived?: boolean }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 *
 * @example
 * // GET /lookups/packaging-materials?keyword=box&limit=20&offset=0&mode=salesDropdown
 * // Response:
 * // {
 * //   "success": true,
 * //   "message": "Successfully retrieved packaging material lookup",
 * //   "items": [{ "id": "pm-123", "label": "Large Box (BOX-L)", "isActive": true, "isArchived": false }],
 * //   "offset": 0,
 * //   "limit": 20,
 * //   "hasMore": true
 * // }
 */
const getPackagingMaterialLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const {
    filters = {},
    options = {},
    limit = 50,
    offset = 0,
  } = req.normalizedQuery;

  const { mode } = options;

  const { items, hasMore } = await fetchPaginatedPackagingMaterialLookupService(
    user,
    {
      filters,
      limit,
      offset,
      mode,
    }
  );

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved packaging material lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated SKU Code Base lookup options.
 *
 * This controller:
 * - Enforces access control via service-layer permission checks.
 * - Applies visibility filters (e.g., restrict to active code bases for non-admin users).
 * - Handles pagination via `limit` and `offset` query parameters.
 * - Returns results formatted for dropdown usage, including UI flags.
 *
 * Expected query structure (via `req.normalizedQuery`):
 * - filters: Optional object (e.g., { keyword, brand_code, category_code, status_id })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/sku-code-bases
 * @access Protected
 * @permission `view_sku_code_base_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Express request object containing user and normalizedQuery
 * @param {Express.Response} res - Express response object used to send JSON response
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{
 *      id: string,
 *      label: string,
 *      isActive?: boolean
 *    }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getSkuCodeBaseLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchSkuCodeBaseLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved SKU Code Base lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated Product lookup options.
 *
 * Responsibilities:
 * - Call service-layer access control and filtering logic.
 * - Apply enforced visibility rules (e.g., active-only products for restricted users).
 * - Support pagination via `limit` and `offset` query parameters.
 * - Return results formatted for dropdowns/autocomplete components.
 *
 * Expected query structure from `req.normalizedQuery`:
 * - filters: Optional object (e.g., { keyword, brand, category, series, status_id })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/products
 * @access Protected
 * @permission `view_product_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Request containing authenticated user + normalized query params.
 * @param {Express.Response} res - Response used to send lookup results.
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{ id: string, label: string, isActive?: boolean }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getProductLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchProductLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved Product lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated Status lookup options.
 *
 * Responsibilities:
 * - Call service-layer access control & visibility rules.
 * - Apply permission-based filters (active-only if restricted).
 * - Support pagination via `limit` and `offset` query parameters.
 * - Return results formatted for dropdowns/autocomplete components.
 *
 * Expected query structure from `req.normalizedQuery`:
 * - filters: Optional object (e.g., { keyword, name, is_active })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/statuses
 * @access Protected
 * @permission `view_status_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Request with user + normalized query params.
 * @param {Express.Response} res - Response containing lookup results.
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{ id, label, isActive }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getStatusLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  // Service handles filtering, ACL enforcement, enrichment, pagination
  const dropdownResult = await fetchStatusLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved Status lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated User lookup options.
 *
 * Responsibilities:
 * - Delegate visibility, ACL, and filtering logic to the service layer.
 * - Support pagination via `limit` and `offset`.
 * - Return results formatted for dropdowns / autocomplete components.
 *
 * Expected query structure from `req.normalizedQuery`:
 * - filters: Optional object (e.g., { keyword, roleIds, statusIds })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/users
 * @access Protected
 * @permission `view_user_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Request containing authenticated user + normalized query params.
 * @param {Express.Response} res - Response used to send lookup results.
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{
 *      id: string,
 *      label: string,
 *      subLabel?: string,
 *      isActive?: boolean
 *    }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getUserLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchUserLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved User lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated Role lookup options.
 *
 * Responsibilities:
 * - Delegate visibility, ACL, and filtering logic to the service layer.
 * - Support pagination via `limit` and `offset`.
 * - Return results formatted for dropdowns / autocomplete components.
 *
 * Expected query structure from `req.normalizedQuery`:
 * - filters: Optional object (e.g., { keyword, role_group })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/roles
 * @access Protected
 * @permission `view_role_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req - Request containing authenticated user + normalized query params.
 * @param {Express.Response} res - Response used to send lookup results.
 *
 * @returns {void} Responds with JSON:
 *  {
 *    success: boolean,
 *    message: string,
 *    items: Array<{
 *      id: string,
 *      label: string,
 *      isActive?: boolean,
 *      hierarchyLevel?: number
 *    }>,
 *    offset: number,
 *    limit: number,
 *    hasMore: boolean
 *  }
 */
const getRoleLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchRoleLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved Role lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated Manufacturer lookup options.
 *
 * Responsibilities:
 * - Delegate visibility, ACL, and filtering logic to the service layer.
 * - Support pagination via `limit` and `offset`.
 * - Return results formatted for dropdowns / autocomplete components.
 *
 * Expected query structure from `req.normalizedQuery`:
 * - filters: Optional object (e.g., { keyword, statusIds })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/manufacturers
 * @access Protected
 * @permission `view_manufacturer_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 *
 * @returns {void} Responds with JSON:
 * {
 *   success: boolean,
 *   message: string,
 *   items: Array<{
 *     id: string,
 *     label: string,
 *     subLabel?: string,
 *     code?: string,
 *     isActive?: boolean
 *   }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }
 */
const getManufacturerLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchManufacturerLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved Manufacturer lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated Supplier lookup options.
 *
 * Responsibilities:
 * - Delegate visibility, ACL, and filtering logic to the service layer.
 * - Support pagination via `limit` and `offset`.
 * - Return results formatted for dropdowns / autocomplete components.
 *
 * Expected query structure from `req.normalizedQuery`:
 * - filters: Optional object (e.g., { keyword, statusIds })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/suppliers
 * @access Protected
 * @permission `view_supplier_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 *
 * @returns {void} Responds with JSON:
 * {
 *   success: boolean,
 *   message: string,
 *   items: Array<{
 *     id: string,
 *     label: string,
 *     subLabel?: string,
 *     code?: string,
 *     isActive?: boolean
 *   }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }
 */
const getSupplierLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchSupplierLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved Supplier lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving paginated Location Type lookup options.
 *
 * Responsibilities:
 * - Delegate visibility, ACL, and filtering logic to the service layer.
 * - Support pagination via `limit` and `offset`.
 * - Return results formatted for dropdowns / autocomplete components.
 *
 * Expected query structure from `req.normalizedQuery`:
 * - filters: Optional object (e.g., { keyword, statusIds })
 * - limit: Optional number (default 50)
 * - offset: Optional number (default 0)
 *
 * @route GET /lookups/location-types
 * @access Protected
 * @permission `view_location_type_lookup` (enforced in service layer)
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 *
 * @returns {void} Responds with JSON:
 * {
 *   success: boolean,
 *   message: string,
 *   items: Array<{
 *     id: string,
 *     label: string,
 *     code?: string,
 *     isActive?: boolean
 *   }>,
 *   offset: number,
 *   limit: number,
 *   hasMore: boolean
 * }
 */
const getLocationTypeLookupController = wrapAsync(async (req, res) => {
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;

  const dropdownResult = await fetchLocationTypeLookupService(user, {
    filters,
    limit,
    offset,
  });

  const { items, hasMore } = dropdownResult;

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved Location Type lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for fetching batch status lookup data.
 *
 * This endpoint is primarily used by UI dropdowns and lookup
 * components that need to display available batch lifecycle
 * status values.
 *
 * Responsibilities:
 * - Extract authenticated user context
 * - Read normalized query parameters (filters, limit, offset)
 * - Delegate lookup execution to the service layer
 * - Return a standardized API response payload
 *
 * Business logic, permission checks, and data transformation
 * are handled by the service layer.
 *
 * @async
 *
 * @param {Object} req - Express request object
 * @param {Object} req.auth.user - Authenticated user context
 * @param {Object} req.normalizedQuery - Normalized query parameters
 *
 * @param {Object} res - Express response object
 *
 * @returns {Promise<void>}
 * Sends a JSON response containing lookup items and pagination info.
 */
const getBatchStatusLookupController = wrapAsync(async (req, res) => {
  //---------------------------------------------------------
  // Step 1 — Extract user and normalized query parameters
  //---------------------------------------------------------
  const user = req.auth.user;
  const { filters = {}, limit = 50, offset = 0 } = req.normalizedQuery;
  
  //---------------------------------------------------------
  // Step 2 — Execute lookup service
  //---------------------------------------------------------
  const dropdownResult = await fetchBatchStatusLookupService(user, {
    filters,
    limit,
    offset,
  });
  
  const { items, hasMore } = dropdownResult;
  
  //---------------------------------------------------------
  // Step 3 — Send standardized API response
  //---------------------------------------------------------
  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved Batch Status lookup',
    items,
    offset,
    limit,
    hasMore,
  });
});

/**
 * Controller for retrieving packaging material supplier lookup data.
 *
 * This controller is generated via `createLookupController` and provides
 * a standardized lookup endpoint for dropdown / autocomplete components
 * with pagination ("load more" pattern).
 *
 * ------------------------------------------------------------------
 * Behavior
 * ------------------------------------------------------------------
 * - Extracts authenticated user from request (via middleware)
 * - Reads normalized query parameters (filters, limit, offset)
 * - Delegates execution to lookup service
 * - Returns standardized response payload
 *
 * NOTE:
 * The core execution logic is handled by the shared
 * `createLookupController` factory.
 *
 * ------------------------------------------------------------------
 *
 * @route GET /lookups/packaging-material-suppliers
 *
 * @param {object} req
 * @param {object} req.auth.user - Authenticated user (injected by auth middleware)
 * @param {object} req.normalizedQuery - Injected by normalization middleware
 * @param {object} [req.normalizedQuery.filters]
 * @param {number} [req.normalizedQuery.limit=50]
 * @param {number} [req.normalizedQuery.offset=0]
 *
 * @param {object} res
 *
 * @returns {Promise<void>}
 */
const getPackagingMaterialSupplierLookupController =
  createLookupController({
    service: fetchPackagingMaterialSupplierLookupService,
    successMessage:
      'Successfully retrieved Packaging Material Supplier lookup',
  });

module.exports = {
  getBatchRegistryLookupController,
  getWarehouseLookupController,
  getLotAdjustmentLookupController,
  fetchCustomerLookupController,
  getCustomerAddressLookupController,
  getOrderTypeLookupController,
  getPaymentMethodLookupController,
  getDiscountLookupController,
  getTaxRateLookupController,
  getDeliveryMethodLookupController,
  getSkuLookupController,
  getPricingLookupController,
  getPackagingMaterialLookupController,
  getSkuCodeBaseLookupController,
  getProductLookupController,
  getStatusLookupController,
  getUserLookupController,
  getRoleLookupController,
  getManufacturerLookupController,
  getSupplierLookupController,
  getLocationTypeLookupController,
  getBatchStatusLookupController,
  getPackagingMaterialSupplierLookupController,
};
