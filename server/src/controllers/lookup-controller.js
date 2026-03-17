const { wrapAsyncHandler } = require('../middlewares/async-handler');
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
const getBatchRegistryLookupController = wrapAsyncHandler(async (req, res) => {
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
const getWarehouseLookupController = wrapAsyncHandler(async (req, res) => {
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
const getLotAdjustmentLookupController = wrapAsyncHandler(async (req, res) => {
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
 * Customer lookup controller.
 *
 * Provides paginated customer options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/customers
 * @permission view_customer_lookup
 */
const getCustomerLookupController = createLookupController({
  service: fetchCustomerLookupService,
  successMessage: 'Successfully retrieved customer lookup',
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
const getCustomerAddressLookupController = wrapAsyncHandler(async (req, res) => {
  const customerId = req.query.customerId;

  const addresses = await fetchCustomerAddressLookupService(customerId);

  res.status(200).json({
    success: true,
    message: 'Customer address lookup data retrieved successfully.',
    data: addresses,
  });
});

/**
 * Order type lookup controller.
 *
 * Provides paginated order type options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/order-types
 * @permission view_order_type_lookup
 */
const getOrderTypeLookupController = createLookupController({
  service: fetchOrderTypeLookupService,
  successMessage: 'Successfully retrieved order type lookup',
});

/**
 * Payment method lookup controller.
 *
 * Provides paginated payment method options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/payment-methods
 * @permission view_payment_method_lookup
 */
const getPaymentMethodLookupController = createLookupController({
  service: fetchPaginatedPaymentMethodLookupService,
  successMessage: 'Successfully retrieved payment method lookup',
});

/**
 * Discount lookup controller.
 *
 * Provides paginated discount options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/discounts
 * @permission view_discount_lookup
 */
const getDiscountLookupController = createLookupController({
  service: fetchPaginatedDiscountLookupService,
  successMessage: 'Successfully retrieved discount lookup',
});

/**
 * Tax rate lookup controller.
 *
 * Provides paginated tax rate options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/tax-rates
 * @permission view_tax_rate_lookup
 */
const getTaxRateLookupController = createLookupController({
  service: fetchPaginatedTaxRateLookupService,
  successMessage: 'Successfully retrieved tax rate lookup',
});

/**
 * Delivery method lookup controller.
 *
 * Provides paginated delivery method options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/delivery-methods
 * @permission view_delivery_method_lookup
 */
const getDeliveryMethodLookupController = createLookupController({
  service: fetchPaginatedDeliveryMethodLookupService,
  successMessage: 'Successfully retrieved delivery method lookup',
});

/**
 * SKU lookup controller.
 *
 * Provides paginated SKU options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/skus
 * @permission view_sku_lookup
 */
const getSkuLookupController = createLookupController({
  service: fetchPaginatedSkuLookupService,
  successMessage: 'Successfully retrieved SKU lookup',
});

/**
 * Pricing lookup controller.
 *
 * Provides paginated pricing options for dropdown and autocomplete components.
 *
 * Supports dynamic label formatting based on SKU context and `labelOnly` option.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/pricing
 * @permission view_pricing_lookup
 */
const getPricingLookupController = createLookupController({
  service: async (user, { filters, options, limit, offset }) => {
    return fetchPaginatedPricingLookupService(user, {
      filters,
      limit,
      offset,
      displayOptions: {
        showSku: !filters?.skuId,
        labelOnly: options?.labelOnly,
      },
    });
  },
  successMessage: 'Successfully retrieved pricing lookup',
});

/**
 * Packaging material lookup controller.
 *
 * Provides paginated packaging material options for dropdown and autocomplete components.
 *
 * Supports mode-based filtering (e.g., `salesDropdown`).
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/packaging-materials
 * @permission view_packaging_material_lookup
 */
const getPackagingMaterialLookupController = createLookupController({
  service: async (user, { filters, options, limit, offset }) => {
    return fetchPaginatedPackagingMaterialLookupService(user, {
      filters,
      limit,
      offset,
      mode: options?.mode,
    });
  },
  successMessage: 'Successfully retrieved packaging material lookup',
});

/**
 * SKU Code Base lookup controller.
 *
 * Provides paginated SKU code base options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/sku-code-bases
 * @permission view_sku_code_base_lookup
 */
const getSkuCodeBaseLookupController = createLookupController({
  service: fetchSkuCodeBaseLookupService,
  successMessage: 'Successfully retrieved SKU Code Base lookup',
});

/**
 * Product lookup controller.
 *
 * Provides paginated product options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/products
 * @permission view_product_lookup
 */
const getProductLookupController = createLookupController({
  service: fetchProductLookupService,
  successMessage: 'Successfully retrieved Product lookup',
});

/**
 * Status lookup controller.
 *
 * Provides paginated status options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/statuses
 * @permission view_status_lookup
 */
const getStatusLookupController = createLookupController({
  service: fetchStatusLookupService,
  successMessage: 'Successfully retrieved Status lookup',
});

/**
 * User lookup controller.
 *
 * Provides paginated user options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/users
 * @permission view_user_lookup
 */
const getUserLookupController = createLookupController({
  service: fetchUserLookupService,
  successMessage: 'Successfully retrieved User lookup',
});

/**
 * Role lookup controller.
 *
 * Provides paginated role options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/roles
 * @permission view_role_lookup
 */
const getRoleLookupController = createLookupController({
  service: fetchRoleLookupService,
  successMessage: 'Successfully retrieved Role lookup',
});

/**
 * Manufacturer lookup controller.
 *
 * Provides paginated manufacturer options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/manufacturers
 * @permission view_manufacturer_lookup
 */
const getManufacturerLookupController = createLookupController({
  service: fetchManufacturerLookupService,
  successMessage: 'Successfully retrieved Manufacturer lookup',
});

/**
 * Supplier lookup controller.
 *
 * Provides paginated supplier options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/suppliers
 * @permission view_supplier_lookup
 */
const getSupplierLookupController = createLookupController({
  service: fetchSupplierLookupService,
  successMessage: 'Successfully retrieved Supplier lookup',
});

/**
 * Location Type lookup controller.
 *
 * Provides paginated location type options for dropdown and autocomplete components.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/location-types
 * @permission view_location_type_lookup
 */
const getLocationTypeLookupController = createLookupController({
  service: fetchLocationTypeLookupService,
  successMessage: 'Successfully retrieved Location Type lookup',
});

/**
 * Batch status lookup controller.
 *
 * Provides paginated batch status options for dropdown and workflow configuration.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/batch-statuses
 * @permission view_batch_status_lookup
 */
const getBatchStatusLookupController = createLookupController({
  service: fetchBatchStatusLookupService,
  successMessage: 'Successfully retrieved Batch Status lookup',
});

/**
 * Packaging material supplier lookup controller.
 *
 * Provides paginated supplier options for packaging material sourcing workflows.
 *
 * Implementation is delegated to `createLookupController`.
 * Business logic, access control, and transformation are handled in the service layer.
 *
 * @route GET /lookups/packaging-material-suppliers
 * @permission view_packaging_material_supplier_lookup
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
  getCustomerLookupController,
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
