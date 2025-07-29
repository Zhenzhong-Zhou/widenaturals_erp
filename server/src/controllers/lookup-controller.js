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
  fetchPaginatedSkuLookupService, fetchPaginatedPricingLookupService,
} = require('../services/lookup-service');
const { logInfo } = require('../utils/logger-helper');

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
      user: req.user?.id,
      ip: req.ip,
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
  const user = req.user;
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
  const user = req.user;
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
  const user = req.user;
  const { keyword = '', limit, offset } = req.normalizedQuery.filters;

  const dropdownResult = await fetchCustomerLookupService(
    {
      keyword,
      limit,
      offset,
    },
    user
  );

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
 * Controller to handle order type lookup for dropdown components.
 *
 * - Retrieve the authenticated user and query filters (e.g., `keyword`).
 * - Applies permission-based filtering and category restriction via service layer.
 * - Returns a minimal or full transformed result based on user permissions.
 *
 * Example query: `GET /api/lookup/order-types?keyword=transfer`
 *
 * @function
 * @async
 * @param {import('express').Request} req - Express request object, expects `req.user` and `req.normalizedQuery.filters`
 * @param {import('express').Response} res - Express response object used to send JSON response
 * @returns {Promise<void>} JSON response with transformed order type lookup data
 */
const getOrderTypeLookupController = wrapAsync(async (req, res) => {
  const user = req.user;
  const { filters = {} } = req.normalizedQuery;
  
  const result = await fetchOrderTypeLookupService(user, { filters });

  return res.status(200).json({
    success: true,
    message: 'Successfully retrieved order type lookup',
    data: result,
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
 * - Requires authenticated user (req.user)
 * - Results and filtering may be adjusted based on permissions (e.g., view_all_payment_methods, view_payment_code)
 */
const getPaymentMethodLookupController = wrapAsync(async (req, res) => {
  const user = req.user;
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
  const user = req.user;
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
  const user = req.user;
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
  const user = req.user;
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
  const user = req.user;
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
  const user = req.user;
  const {
    filters = {},
    options = {},
    keyword = '',
    limit = 50,
    offset = 0,
  } = req.normalizedQuery;
  
  const dropdownResult = await fetchPaginatedPricingLookupService(user, {
    filters,
    keyword,
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
};
