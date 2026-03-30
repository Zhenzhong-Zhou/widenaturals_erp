/**
 * @file lookup.js
 * @description Registers all lookup (dropdown/autocomplete) GET routes on the Express router.
 *
 * All routes follow a consistent middleware pipeline built by `registerLookupRoute`:
 *   authorize → validate → normalizeQuery → controller
 *
 * Routes are read-only, permission-protected, and return a standard envelope:
 *   { success, message, items, limit, offset, hasMore }
 *
 * Pagination mode:
 *   All routes in this file are dropdowns/lookups — the factory default is 'offset'.
 *   offset + limit only. page is never attached to req.normalizedQuery.
 *
 * Routes without pagination (includePagination: false) do not need paginationMode.
 */

'use strict';

const express                  = require('express');
const { registerLookupRoute }  = require('./factories/lookup-route-factory');
const { PERMISSIONS }          = require('../utils/constants/domain/lookup-constants');
const {
  batchRegistryLookupQuerySchema,
  warehouseLookupQuerySchema,
  lotAdjustmentTypeLookupSchema,
  customerAddressLookupQuerySchema,
  orderTypeLookupQuerySchema,
  skuLookupQuerySchema,
  pricingLookupQuerySchema,
  packagingMaterialLookupQuerySchema,
  statusLookupQuerySchema,
  productLookupQuerySchema,
  skuCodeBaseLookupQuerySchema,
  deliveryMethodLookupQuerySchema,
  packagingMaterialSupplierLookupQuerySchema,
  customerLookupQuerySchema,
  supplierLookupQuerySchema,
  manufacturerLookupQuerySchema,
  userLookupQuerySchema,
  roleLookupQuerySchema,
  locationTypeLookupQuerySchema,
  batchStatusLookupQuerySchema,
  paymentMethodLookupQuerySchema,
  discountLookupQuerySchema,
  taxRateLookupQuerySchema,
} = require('../validators/lookup-validators');
const {
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
} = require('../controllers/lookup-controller');

const router = express.Router();

//=========================================================
// COMPLEX LOOKUPS (custom config required)
//=========================================================

/**
 * @route GET /lookups/batch-registry
 * @description Paginated batch registry records for inventory dropdowns.
 * Filters: batchType, warehouseId, locationId. No sorting.
 * Pagination: offset-based — navigates by raw offset, not page number.
 * @access protected
 * @permission PERMISSIONS.VIEW_BATCH_REGISTRY
 */
registerLookupRoute(router, {
  path:       '/batch-registry',
  permission: [PERMISSIONS.VIEW_BATCH_REGISTRY],
  schema:     batchRegistryLookupQuerySchema,
  controller: getBatchRegistryLookupController,
  config: {
    // filterKeysOrSchema: batchRegistryLookupQuerySchema,
    filterKeysOrSchema: ['batchType', 'warehouseId', 'locationId'],
  },
});

/**
 * @route GET /lookups/warehouses
 * @description Warehouse records for UI dropdowns. Filters: warehouseTypeId.
 * No pagination — warehouse count is bounded by physical locations.
 * @access protected
 * @permission PERMISSIONS.VIEW_WAREHOUSE
 */
registerLookupRoute(router, {
  path:       '/warehouses',
  permission: [PERMISSIONS.VIEW_WAREHOUSE],
  schema:     warehouseLookupQuerySchema,
  controller: getWarehouseLookupController,
  config: {
    filterKeysOrSchema: warehouseLookupQuerySchema,
    includePagination: false,
  },
});

/**
 * @route GET /lookups/lot-adjustment-types
 * @description Lot adjustment types for inventory UI.
 * Filters: excludeInternal (bool), restrictToQtyAdjustment (bool).
 * No pagination — config table, bounded by definition count.
 * @access protected
 * @permission PERMISSIONS.VIEW_LOT_ADJUSTMENT_TYPE
 */
registerLookupRoute(router, {
  path:       '/lot-adjustment-types',
  permission: [PERMISSIONS.VIEW_LOT_ADJUSTMENT_TYPE],
  schema:     lotAdjustmentTypeLookupSchema,
  controller: getLotAdjustmentLookupController,
  config: {
    booleanKeys: ['excludeInternal', 'restrictToQtyAdjustment'],
  },
});

/**
 * @route GET /lookups/addresses/by-customer
 * @description Address records for a given customer. Requires customerId in query.
 * Pagination: offset-based — dropdown navigates by raw offset.
 * @access protected
 * @permission PERMISSIONS.VIEW_CUSTOMER_ADDRESS
 */
registerLookupRoute(router, {
  path:       '/addresses/by-customer',
  permission: [PERMISSIONS.VIEW_CUSTOMER_ADDRESS],
  schema:     customerAddressLookupQuerySchema,
  controller: getCustomerAddressLookupController,
  config: {
    arrayKeys:  ['customerId'],
    filterKeysOrSchema: customerAddressLookupQuerySchema,
  },
});

/**
 * @route GET /lookups/order-types
 * @description Order type options for dropdowns.
 * Pagination: offset-based — dropdown navigates by raw offset.
 * @access protected
 * @permission PERMISSIONS.VIEW_ORDER_TYPE
 */
registerLookupRoute(router, {
  path:       '/order-types',
  permission: [PERMISSIONS.VIEW_ORDER_TYPE],
  schema:     orderTypeLookupQuerySchema,
  controller: getOrderTypeLookupController,
  config: {
    filterKeysOrSchema: orderTypeLookupQuerySchema,
  },
});

/**
 * @route GET /lookups/skus
 * @description Paginated SKU options for dropdowns and selectors.
 * Filters: keyword. Options: includeBarcode (bool).
 * Pagination: offset-based — dropdown navigates by raw offset.
 * @access protected
 * @permission PERMISSIONS.VIEW_SKU
 */
registerLookupRoute(router, {
  path:       '/skus',
  permission: [PERMISSIONS.VIEW_SKU],
  schema:     skuLookupQuerySchema,
  controller: getSkuLookupController,
  config: {
    optionBooleanKeys: ['includeBarcode'],
  },
});

/**
 * @route GET /lookups/pricing
 * @description Paginated pricing options for dropdowns and selectors.
 * Filters: keyword, skuId. Options: labelOnly (bool).
 * Pagination: offset-based — dropdown navigates by raw offset.
 * @access protected
 * @permission PERMISSIONS.VIEW_PRICING
 */
registerLookupRoute(router, {
  path:       '/pricing',
  permission: [PERMISSIONS.VIEW_PRICING],
  schema:     pricingLookupQuerySchema,
  controller: getPricingLookupController,
  config: {
    filterKeysOrSchema: ['keyword', 'skuId'],
    optionBooleanKeys: ['labelOnly'],
  },
});

/**
 * @route GET /lookups/packaging-materials
 * @description Paginated packaging material options for dropdowns and selectors.
 * Filters: keyword. Options: mode (string — 'generic' | 'salesDropdown').
 * @access protected
 * @permission PERMISSIONS.VIEW_PACKAGING_MATERIAL
 */
registerLookupRoute(router, {
  path:       '/packaging-materials',
  permission: [PERMISSIONS.VIEW_PACKAGING_MATERIAL],
  schema:     packagingMaterialLookupQuerySchema,
  controller: getPackagingMaterialLookupController,
  config: {
    optionStringKeys: ['mode'],
  },
});

/**
 * @route GET /lookups/statuses
 * @description Generic system status values for dropdowns.
 * Filters: name, keyword, is_active (bool).
 * @access protected
 * @permission PERMISSIONS.VIEW_STATUS
 */
registerLookupRoute(router, {
  path:       '/statuses',
  permission: [PERMISSIONS.VIEW_STATUS],
  schema:     statusLookupQuerySchema,
  controller: getStatusLookupController,
  config: {
    booleanKeys: ['is_active'],
    filterKeysOrSchema: ['name', 'keyword', 'is_active'],
  },
});

/**
 * @route GET /lookups/products
 * @description Product options for dropdowns and selection fields.
 * Filters: keyword, brand, category, series.
 * @access protected
 * @permission PERMISSIONS.VIEW_PRODUCT
 */
registerLookupRoute(router, {
  path:       '/products',
  permission: [PERMISSIONS.VIEW_PRODUCT],
  schema:     productLookupQuerySchema,
  controller: getProductLookupController,
  config: {
    filterKeysOrSchema: ['keyword', 'brand', 'category', 'series'],
  },
});

/**
 * @route GET /lookups/sku-code-bases
 * @description SKU code base definitions for SKU generation.
 * Filters: keyword, brand_code, category_code.
 * @access protected
 * @permission PERMISSIONS.VIEW_SKU_CODE_BASE
 */
registerLookupRoute(router, {
  path:       '/sku-code-bases',
  permission: [PERMISSIONS.VIEW_SKU_CODE_BASE],
  schema:     skuCodeBaseLookupQuerySchema,
  controller: getSkuCodeBaseLookupController,
  config: {
    filterKeysOrSchema: ['keyword', 'brand_code', 'category_code'],
  },
});

/**
 * @route GET /lookups/delivery-methods
 * @description Delivery method options for shipping and fulfillment.
 * Filters: keyword. BooleanKeys: isPickupLocation.
 * @access protected
 * @permission PERMISSIONS.VIEW_DELIVERY_METHOD
 */
registerLookupRoute(router, {
  path:       '/delivery-methods',
  permission: [PERMISSIONS.VIEW_DELIVERY_METHOD],
  schema:     deliveryMethodLookupQuerySchema,
  controller: getDeliveryMethodLookupController,
  config: {
    booleanKeys: ['isPickupLocation'],
  },
});

/**
 * @route GET /lookups/packaging-material-suppliers
 * @description Packaging material supplier options for dropdowns.
 * Filters: keyword. BooleanKeys: isPreferred.
 * @access protected
 * @permission PERMISSIONS.VIEW_PACKAGING_MATERIAL_SUPPLIER
 */
registerLookupRoute(router, {
  path:       '/packaging-material-suppliers',
  permission: [PERMISSIONS.VIEW_PACKAGING_MATERIAL_SUPPLIER],
  schema:     packagingMaterialSupplierLookupQuerySchema,
  controller: getPackagingMaterialSupplierLookupController,
  config: {
    booleanKeys: ['isPreferred'],
    filterKeysOrSchema:  ['keyword'],
  },
});

//=========================================================
// SIMPLE LOOKUPS (factory defaults — keyword + offset-based pagination)
//=========================================================

/**
 * @route GET /lookups/customers
 * @description Paginated customer list for dropdowns and autocomplete.
 * Filters: keyword. Pagination: limit, offset.
 * @access protected
 * @permission PERMISSIONS.VIEW_CUSTOMER
 */
registerLookupRoute(router, {
  path:       '/customers',
  permission: [PERMISSIONS.VIEW_CUSTOMER],
  schema:     customerLookupQuerySchema,
  controller: getCustomerLookupController,
});

/**
 * @route GET /lookups/suppliers
 * @description Supplier options for dropdowns. Keyword search + pagination.
 * @access protected
 * @permission PERMISSIONS.VIEW_SUPPLIER
 */
registerLookupRoute(router, {
  path:       '/suppliers',
  permission: [PERMISSIONS.VIEW_SUPPLIER],
  schema:     supplierLookupQuerySchema,
  controller: getSupplierLookupController,
});

/**
 * @route GET /lookups/manufacturers
 * @description Manufacturer options for dropdowns. Keyword search + pagination.
 * @access protected
 * @permission PERMISSIONS.VIEW_MANUFACTURER
 */
registerLookupRoute(router, {
  path:       '/manufacturers',
  permission: [PERMISSIONS.VIEW_MANUFACTURER],
  schema:     manufacturerLookupQuerySchema,
  controller: getManufacturerLookupController,
});

/**
 * @route GET /lookups/users
 * @description User options for assignment and ownership selection. Keyword search + pagination.
 * @access protected
 * @permission PERMISSIONS.VIEW_USER
 */
registerLookupRoute(router, {
  path:       '/users',
  permission: [PERMISSIONS.VIEW_USER],
  schema:     userLookupQuerySchema,
  controller: getUserLookupController,
});

/**
 * @route GET /lookups/roles
 * @description Role options for admin configuration. Keyword search + pagination.
 * @access protected
 * @permission PERMISSIONS.VIEW_ROLE
 */
registerLookupRoute(router, {
  path:       '/roles',
  permission: [PERMISSIONS.VIEW_ROLE],
  schema:     roleLookupQuerySchema,
  controller: getRoleLookupController,
});

/**
 * @route GET /lookups/location-types
 * @description Location type options for configuration. Keyword search + pagination.
 * @access protected
 * @permission PERMISSIONS.VIEW_LOCATION_TYPE
 */
registerLookupRoute(router, {
  path:       '/location-types',
  permission: [PERMISSIONS.VIEW_LOCATION_TYPE],
  schema:     locationTypeLookupQuerySchema,
  controller: getLocationTypeLookupController,
});

/**
 * @route GET /lookups/batch-statuses
 * @description Batch lifecycle status options for workflow dropdowns. Keyword search + pagination.
 * @access protected
 * @permission PERMISSIONS.VIEW_BATCH_STATUS
 */
registerLookupRoute(router, {
  path:       '/batch-statuses',
  permission: [PERMISSIONS.VIEW_BATCH_STATUS],
  schema:     batchStatusLookupQuerySchema,
  controller: getBatchStatusLookupController,
});

/**
 * @route GET /lookups/payment-methods
 * @description Payment method options for order and billing workflows. Keyword search + pagination.
 * @access protected
 * @permission PERMISSIONS.VIEW_PAYMENT_METHOD
 */
registerLookupRoute(router, {
  path:       '/payment-methods',
  permission: [PERMISSIONS.VIEW_PAYMENT_METHOD],
  schema:     paymentMethodLookupQuerySchema,
  controller: getPaymentMethodLookupController,
});

/**
 * @route GET /lookups/discounts
 * @description Discount options for pricing and order calculations. Keyword search + pagination.
 * @access protected
 * @permission PERMISSIONS.VIEW_DISCOUNT
 */
registerLookupRoute(router, {
  path:       '/discounts',
  permission: [PERMISSIONS.VIEW_DISCOUNT],
  schema:     discountLookupQuerySchema,
  controller: getDiscountLookupController,
});

/**
 * @route GET /lookups/tax-rates
 * @description Tax rate options for order pricing and compliance. Keyword search + pagination.
 * @access protected
 * @permission PERMISSIONS.VIEW_TAX_RATE
 */
registerLookupRoute(router, {
  path:       '/tax-rates',
  permission: [PERMISSIONS.VIEW_TAX_RATE],
  schema:     taxRateLookupQuerySchema,
  controller: getTaxRateLookupController,
});

module.exports = router;
