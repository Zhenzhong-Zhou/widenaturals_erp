/**
 * @file lookup-controller.js
 * @module controllers/lookup-controller
 *
 * @description
 * Lookup controllers for dropdown and autocomplete endpoints.
 *
 * Every controller in this file is produced by `createLookupController` —
 * a factory that wraps a service call with a standardized request/response
 * shape, error handling, and traceId propagation.
 *
 * Business logic, access control, and data transformation are handled
 * in the service layer. Controllers here are intentionally thin.
 *
 * See: controllers/factories/lookup-controller-factory.js
 */

'use strict';

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
  fetchPaginatedPricingGroupLookupService,
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
const { createLookupController } = require('./factories/lookup-controller-factory');

// ─────────────────────────────────────────────────────────────────────────────
// Batch Registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Batch registry lookup.
 * Supports batchType, warehouseId, locationId, limit, offset query params.
 *
 * @route      GET /api/v1/lookups/batch-registry
 * @permission view_batch_registry_lookup
 */
const getBatchRegistryLookupController = createLookupController({
  service:        fetchBatchRegistryLookupService,
  successMessage: 'Batch registry lookup retrieved successfully.',
  passUser:       false,
});

// ─────────────────────────────────────────────────────────────────────────────
// Warehouse
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Warehouse lookup.
 * Supports locationTypeId, warehouseTypeId, includeArchived query params.
 *
 * @route      GET /api/v1/lookups/warehouses
 * @permission view_warehouse_lookup
 */
const getWarehouseLookupController = createLookupController({
  service:        fetchWarehouseLookupService,
  successMessage: 'Warehouse lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Lot Adjustment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lot adjustment type lookup.
 * Supports excludeInternal query param to filter out internal-only types.
 *
 * @route      GET /api/v1/lookups/lot-adjustment-types
 * @permission view_lot_adjustment_lookup
 */
const getLotAdjustmentLookupController = createLookupController({
  service:        fetchLotAdjustmentLookupService,
  successMessage: 'Lot adjustment lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Customer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/customers
 * @permission view_customer_lookup
 */
const getCustomerLookupController = createLookupController({
  service:        fetchCustomerLookupService,
  successMessage: 'Customer lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Customer Address
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Customer address lookup.
 * Requires customerId as a query param. passUser is false — user not needed by service.
 *
 * @route      GET /api/v1/lookups/customer-addresses
 * @permission view_customer_lookup
 */
const getCustomerAddressLookupController = createLookupController({
  service: async (normalizedParams) => {
    const customerId = normalizedParams?.filters?.customerId[0];
    return fetchCustomerAddressLookupService(customerId);
  },
  successMessage: 'Customer address lookup retrieved successfully.',
  passUser: false,
});

// ─────────────────────────────────────────────────────────────────────────────
// Order Type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/order-types
 * @permission view_order_type_lookup
 */
const getOrderTypeLookupController = createLookupController({
  service:        fetchOrderTypeLookupService,
  successMessage: 'Order type lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Payment Method
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/payment-methods
 * @permission view_payment_method_lookup
 */
const getPaymentMethodLookupController = createLookupController({
  service:        fetchPaginatedPaymentMethodLookupService,
  successMessage: 'Payment method lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Discount
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/discounts
 * @permission view_discount_lookup
 */
const getDiscountLookupController = createLookupController({
  service:        fetchPaginatedDiscountLookupService,
  successMessage: 'Discount lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Tax Rate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/tax-rates
 * @permission view_tax_rate_lookup
 */
const getTaxRateLookupController = createLookupController({
  service:        fetchPaginatedTaxRateLookupService,
  successMessage: 'Tax rate lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Delivery Method
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/delivery-methods
 * @permission view_delivery_method_lookup
 */
const getDeliveryMethodLookupController = createLookupController({
  service:        fetchPaginatedDeliveryMethodLookupService,
  successMessage: 'Delivery method lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// SKU
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/skus
 * @permission view_sku_lookup
 */
const getSkuLookupController = createLookupController({
  service:        fetchPaginatedSkuLookupService,
  successMessage: 'SKU lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Pricing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pricing lookup.
 * Wrapped to pass displayOptions — showSku is derived from whether skuId filter
 * is present, and labelOnly is forwarded from options.
 *
 * @route      GET /api/v1/lookups/pricing
 * @permission view_pricing_lookup
 */
// todo: name and docstring
const getPricingGroupLookupController = createLookupController({
  service: async (user, { filters, options, limit, offset }) => {
    return fetchPaginatedPricingGroupLookupService(user, {
      filters,
      limit,
      offset,
      displayOptions: {
        showSku:   !filters?.skuId,
        labelOnly: options?.labelOnly,
      },
    });
  },
  successMessage: 'Pricing lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Packaging Material
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Packaging material lookup.
 * Wrapped to forward mode option (e.g. 'salesDropdown') to the service.
 *
 * @route      GET /api/v1/lookups/packaging-materials
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
  successMessage: 'Packaging material lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// SKU Code Base
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/sku-code-bases
 * @permission view_sku_code_base_lookup
 */
const getSkuCodeBaseLookupController = createLookupController({
  service:        fetchSkuCodeBaseLookupService,
  successMessage: 'SKU code base lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Product
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/products
 * @permission view_product_lookup
 */
const getProductLookupController = createLookupController({
  service:        fetchProductLookupService,
  successMessage: 'Product lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/statuses
 * @permission view_status_lookup
 */
const getStatusLookupController = createLookupController({
  service:        fetchStatusLookupService,
  successMessage: 'Status lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// User
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/users
 * @permission view_user_lookup
 */
const getUserLookupController = createLookupController({
  service:        fetchUserLookupService,
  successMessage: 'User lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Role
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/roles
 * @permission view_role_lookup
 */
const getRoleLookupController = createLookupController({
  service:        fetchRoleLookupService,
  successMessage: 'Role lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Manufacturer
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/manufacturers
 * @permission view_manufacturer_lookup
 */
const getManufacturerLookupController = createLookupController({
  service:        fetchManufacturerLookupService,
  successMessage: 'Manufacturer lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Supplier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/suppliers
 * @permission view_supplier_lookup
 */
const getSupplierLookupController = createLookupController({
  service:        fetchSupplierLookupService,
  successMessage: 'Supplier lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Location Type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/location-types
 * @permission view_location_type_lookup
 */
const getLocationTypeLookupController = createLookupController({
  service:        fetchLocationTypeLookupService,
  successMessage: 'Location type lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Batch Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/batch-statuses
 * @permission view_batch_status_lookup
 */
const getBatchStatusLookupController = createLookupController({
  service:        fetchBatchStatusLookupService,
  successMessage: 'Batch status lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Packaging Material Supplier
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @route      GET /api/v1/lookups/packaging-material-suppliers
 * @permission view_packaging_material_supplier_lookup
 */
const getPackagingMaterialSupplierLookupController = createLookupController({
  service:        fetchPackagingMaterialSupplierLookupService,
  successMessage: 'Packaging material supplier lookup retrieved successfully.',
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

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
  getPricingGroupLookupController,
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
