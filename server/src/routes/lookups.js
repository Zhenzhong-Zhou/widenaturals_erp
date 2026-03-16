const express = require('express');
const { authorize } = require('../middlewares/authorize');
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
const createQueryNormalizationMiddleware = require('../middlewares/query-normalization');
const { sanitizeFields } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const {
  batchRegistryLookupQuerySchema,
  warehouseLookupQuerySchema,
  customerLookupQuerySchema,
  customerAddressLookupQuerySchema,
  lotAdjustmentTypeLookupSchema,
  orderTypeLookupQuerySchema,
  paymentMethodLookupQuerySchema,
  discountLookupQuerySchema,
  taxRateLookupQuerySchema,
  deliveryMethodLookupQuerySchema,
  skuLookupQuerySchema,
  pricingLookupQuerySchema,
  packagingMaterialLookupQuerySchema,
  skuCodeBaseLookupQuerySchema,
  productLookupQuerySchema,
  statusLookupQuerySchema,
  userLookupQuerySchema,
  roleLookupQuerySchema,
  manufacturerLookupQuerySchema,
  supplierLookupQuerySchema,
  locationTypeLookupQuerySchema,
  batchStatusLookupQuerySchema,
  packagingMaterialSupplierLookupQuerySchema,
} = require('../validators/lookup-validators');
const { PERMISSIONS } = require('../utils/constants/domain/lookup-constants');
const { createLookupRoute } = require('./factories/lookup-route-factory');

const router = express.Router();

/**
 * @route GET /lookups/batch-registry
 * @group Lookups - Batch Registry
 * @summary Retrieve batch registry records for dropdowns and inventory utilities.
 *
 * @description
 * Provides filtered and paginated batch registry results for use in inventory-related
 * dropdowns and forms. Supports optional filters such as:
 *
 * - `batchType`: Filter by batch type (`product` or `packaging_material`)
 * - `warehouseId`: Exclude batches already linked to a given warehouse
 * - `locationId`: Exclude batches already linked to a given location
 * - `limit`, `offset`: Supports cursor-based pagination
 *
 * Does **not** support sorting.
 *
 * @access Protected
 * @permission Required:
 * - `view_batch_registry_dropdown`
 *
 * @returns {BatchRegistryDropdown[]} 200 - A list of filtered batch registry records
 */
router.get(
  '/batch-registry',
  authorize([PERMISSIONS.VIEW_BATCH_REGISTRY]),
  createQueryNormalizationMiddleware(
    '',
    [],
    [],
    ['batchType', 'warehouseId', 'locationId'],
    { includePagination: true, includeSorting: false }
  ),
  sanitizeFields(['batchType']),
  validate(batchRegistryLookupQuerySchema, 'query'),
  getBatchRegistryLookupController
);

/**
 * @route GET /lookups/warehouses
 *
 * @description
 * Fetches a list of warehouse records for UI dropdowns and filters.
 * Supports optional filtering by warehouse type.
 *
 * @query
 * - warehouseTypeId (string, optional): Filter by warehouse type
 *
 * @permissions
 * - view_warehouse_lookup
 *
 * @middleware
 * - authorize: Verifies the user has the required permission
 * - createQueryNormalizationMiddleware: Normalizes query parameters
 * - sanitizeFields: Cleans specific query fields
 * - validate: Validates query against schema
 *
 * @response 200 - OK
 * {
 *   success: true,
 *   data: [
 *     {
 *       value: string, // Warehouse ID
 *       label: string, // Display name, e.g., "Main Warehouse (Toronto)"
 *       metadata: {
 *         locationId: string,
 *       }
 *     },
 *     ...
 *   ]
 * }
 */
router.get(
  '/warehouses',
  authorize([PERMISSIONS.VIEW_WAREHOUSE]),
  createQueryNormalizationMiddleware(
    '',
    [],
    [],
    ['warehouseTypeId'], // filterKeys
    { includePagination: false, includeSorting: false }
  ),
  sanitizeFields(['warehouseTypeId']),
  validate(warehouseLookupQuerySchema, 'query'),
  getWarehouseLookupController
);

/**
 * @route GET /lookups/lot-adjustment-types
 * @description Lookup lot adjustment types for inventory UI.
 * Supports optional filtering to exclude internal-only types via query param `?excludeInternal=true`.
 * Requires one of the following permissions:
 * - 'manage_inventory'
 * - 'view_batch_registry_lookup'
 * - 'access_inventory_utilities'
 *
 * @access Protected
 * @returns {200} Array of lookup options:
 *   [
 *     {
 *       value: string, // lot_adjustment_type_id
 *       label: string, // name
 *       actionTypeId: string // inventory_action_type_id
 *     }
 *   ]
 */
router.get(
  '/lot-adjustment-types',
  authorize([PERMISSIONS.VIEW_LOT_ADJUSTMENT_TYPE]),
  createQueryNormalizationMiddleware(
    '',
    [],
    ['excludeInternal', 'restrictToQtyAdjustment']
  ),
  sanitizeFields(['excludeInternal', 'restrictToQtyAdjustment']),
  validate(lotAdjustmentTypeLookupSchema, 'query'),
  getLotAdjustmentLookupController
);

/**
 * GET /lookups/customers
 *
 * Retrieves a paginated list of customers for use in dropdowns or autocomplete fields.
 *
 * Query Parameters:
 * - keyword (optional): Search term for partial matches on customer name or code. Default is an empty string.
 * - limit (optional): Maximum number of results to return. Default is 50, maximum is 100.
 * - offset (optional): Number of records to skip for pagination. Default is 0.
 *
 * Authorization:
 * - Requires the `view_customer` permission.
 *
 * Middlewares:
 * - authorize: Ensures the authenticated user has the required permission.
 * - createQueryNormalizationMiddleware: Normalizes keyword, limit, and offset into a structured query.
 * - sanitizeFields: Trims and sanitizes keyword field.
 * - validate: Validates the final query against `customerLookupQuerySchema`.
 *
 * Response:
 * - 200 OK
 * {
 *   success: true,
 *   message: "Customer lookup fetched successfully",
 *   data: {
 *     results: Array<{ value: string, label: string, metadata: {...} }>,
 *     pagination: { total: number, limit: number, offset: number, hasMore: boolean }
 *   }
 * }
 */
router.get(
  '/customers',
  authorize([PERMISSIONS.VIEW_CUSTOMER]),
  createQueryNormalizationMiddleware(
    '', // moduleKey (optional for sorting)
    [], // arrayKeys (e.g., ['statusId'] if needed)
    [], // booleanKeys (e.g., ['includeArchived'])
    ['keyword'], // filterKeys: what to extract into `filters`
    { includePagination: true, includeSorting: false } // enable pagination normalization
  ),
  sanitizeFields(['keyword']),
  validate(
    customerLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid query parameters.'
  ),
  getCustomerLookupController
);

/**
 * GET /lookups/address/by-customer
 *
 * Retrieves minimal address records associated with a specific customer.
 * Intended for use in lookup UIs such as dropdowns or address selectors.
 *
 * Query Parameters:
 * - customerId (string, required): UUID of the customer whose addresses should be retrieved.
 *
 * Use Cases:
 * - Sales order creation
 * - Shipping/billing address selection
 * - Customer profile and CRM dropdowns
 *
 * Access Control:
 * - Requires user authentication
 * - Requires `view_customer` permission
 *
 * Middleware:
 * - authorize: Verifies permission to view customer data
 * - createQueryNormalizationMiddleware: Normalizes query keys (e.g., parses `customerId` as array-safe)
 * - sanitizeFields: Cleans and trims `customerId`
 * - validate: Validates query using `customerAddressLookupQuerySchema`
 *
 * Responses:
 * - 200 OK: Returns an array of address lookup entries:
 *   [
 *     {
 *       value: string,         // address ID
 *       label: string,         // formatted short address
 *       metadata: { ... }      // optional metadata (e.g., full address, type)
 *     },
 *     ...
 *   ]
 * - 400 Bad Request: Missing or invalid `customerId`
 * - 403 Forbidden: Unauthorized access
 * - 500 Internal Server Error: Failed to fetch or transform address records
 */
router.get(
  '/addresses/by-customer',
  authorize([PERMISSIONS.VIEW_CUSTOMER_ADDRESS]),
  createQueryNormalizationMiddleware(
    '',
    ['customerId'],
    [],
    customerAddressLookupQuerySchema
  ),
  sanitizeFields(['customerId']),
  validate(
    customerAddressLookupQuerySchema,
    'query',
    { convert: true },
    'Invalid query parameters.'
  ),
  getCustomerAddressLookupController
);

/**
 * GET /lookups/order-types
 *
 * Retrieves a filtered list of order types for dropdown use, based on the user's permissions and optional keyword search.
 *
 * Middlewares:
 * - `authorize(['create_orders'])`: Ensures the user has basic permission to initiate orders.
 * - `createQueryNormalizationMiddleware`: Preprocesses query parameters if needed.
 * - `sanitizeFields(['keyword'])`: Trims and sanitizes the keyword.
 * - `validate(orderTypeLookupQuerySchema, 'query')`: Validates query parameters using Joi schema.
 *
 * Query Parameters:
 * - `keyword` (optional): Filters order types by name/code using case-insensitive match.
 *
 * Response: 200 OK
 * {
 *   success: true,
 *   message: "Successfully retrieved order type lookup",
 *   data: [ { id, name }, ... ]
 * }
 */
router.get(
  '/order-types',
  authorize([PERMISSIONS.VIEW_ORDER_TYPE]),
  createQueryNormalizationMiddleware('', [], [], orderTypeLookupQuerySchema),
  sanitizeFields(['keyword']),
  validate(
    orderTypeLookupQuerySchema,
    'query',
    { convert: true },
    'Invalid query parameters.'
  ),
  getOrderTypeLookupController
);

/**
 * @route GET /skus
 * @description
 * Endpoint to fetch paginated SKU lookup options for dropdowns or selectors.
 * Applies permission checks, query normalization, field sanitization, validation, and filtering.
 *
 * Middleware chain includes:
 * - `authorize`: Enforces user permission to view SKU lookups
 * - `createQueryNormalizationMiddleware`: Extracts and structures query parameters (e.g., filters, options, pagination)
 * - `sanitizeFields`: Trims and sanitizes specific fields (e.g., `keyword`)
 * - `validate`: Validates the normalized query against `skuLookupQuerySchema`
 * - `getSkuLookupController`: Handles the request and returns formatted SKU options
 *
 * Query Parameters (after normalization):
 * - `filters.keyword` — Optional search keyword to match product name, SKU, or barcode
 * - `filters.brand` — Optional brand filter
 * - `filters.category` — Optional category filter
 * - `filters.countryCode` — Optional country code filter
 * - `filters.statusId` — Optional SKU status ID filter
 * - `options.includeBarcode` — Optional boolean to include barcode in dropdown labels
 *
 * Pagination:
 * - `limit` — Page size (default: 50)
 * - `offset` — Offset for pagination
 *
 * Response:
 * - `200 OK` with JSON payload:
 *   - `success` (boolean)
 *   - `message` (string)
 *   - `items` (array of `{ id, label }`)
 *   - `limit` (number)
 *   - `offset` (number)
 *   - `hasMore` (boolean)
 *
 * @access Protected
 * @permission Requires `view_sku_lookup` permission
 */
router.get(
  '/skus',
  authorize([PERMISSIONS.VIEW_SKU]),
  createQueryNormalizationMiddleware(
    '', // moduleKey
    [], // arrayKeys
    [], // booleanKeys for filters
    ['keyword'], // filterKeys
    { includePagination: true, includeSorting: false },
    ['includeBarcode'] // optionBooleanKeys (normalized into `options`)
  ),
  sanitizeFields(['keyword']),
  validate(
    skuLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid query parameters.'
  ),
  getSkuLookupController
);

/**
 * @route GET /lookups/pricing
 * @description
 * Endpoint to fetch paginated pricing lookup options for dropdowns or selectors.
 * Applies permission checks, query normalization, field sanitization, validation, and filtering.
 *
 * Middleware chain includes:
 * - `authorize`: Enforces user permission to view pricing lookup
 * - `createQueryNormalizationMiddleware`: Extracts and structures query parameters:
 *     - `filters` (e.g., `skuId`, etc.)
 *     - `keyword` (extracted to root level)
 *     - `options` (e.g., `labelOnly` for minimal dropdown formatting)
 *     - `pagination` (`limit`, `offset`)
 * - `sanitizeFields`: Trims and sanitizes fields like `keyword`
 * - `validate`: Validates the final `normalizedQuery` using `pricingLookupQuerySchema`
 * - `getPricingLookupController`: Handles the request and returns formatted pricing options
 *
 * Query Parameters (after normalization):
 * - `filters`: {
 *     skuId: UUID (optional but commonly required),
 *     locationId: UUID,
 *     priceTypeId: UUID,
 *     statusId: UUID,
 *     validFrom / validTo / validOn: string (date)
 *   }
 * - `keyword`: string — Optional fuzzy search against product name, SKU, and pricing type
 * - `options`: {
 *     labelOnly: boolean — If true, returns `{ id, label }` only per item
 *   }
 * - `limit`: number — Optional pagination limit (default: 50)
 * - `offset`: number — Optional pagination offset
 *
 * Response:
 * - `200 OK` JSON response:
 *   {
 *     success: true,
 *     message: 'Successfully retrieved pricing lookup',
 *     items: Array<{
 *       id: string,
 *       label: string,
 *       [price]?: string,
 *       [pricingTypeName]?: string,
 *       [locationName]?: string,
 *       [isActive]?: boolean,
 *       [isValidToday]?: boolean
 *     }>,
 *     limit: number,
 *     offset: number,
 *     hasMore: boolean
 *   }
 *
 * @access Protected
 * @permission Requires `view_pricing_lookup` permission
 */
router.get(
  '/pricing',
  authorize([PERMISSIONS.VIEW_PRICING]),
  createQueryNormalizationMiddleware(
    '', // moduleKey
    [], // arrayKeys
    [], // booleanKeys for filters
    ['keyword', 'skuId'], // filterKeys to extract `keyword` to root
    { includePagination: true, includeSorting: false },
    ['labelOnly'] // options.labelOnly is normalized here
  ),
  sanitizeFields(['keyword']),
  validate(
    pricingLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid query parameters.'
  ),
  getPricingLookupController
);

/**
 * @route GET /lookups/packaging-materials
 * @description
 * Endpoint to fetch paginated packaging-material lookup options for dropdowns/selectors.
 * Applies permission checks, query normalization, sanitization, validation, and filtering.
 *
 * Middleware chain includes:
 * - `authorize`: Enforces user permission to view packaging-material lookup
 * - `createQueryNormalizationMiddleware`: Extracts and structures query parameters:
 *     - `filters` (e.g., `statusId`, `createdBy`, `updatedBy`, `restrictToUnarchived`)
 *     - `keyword` (extracted to root)
 *     - `options` (e.g., `labelOnly`, `mode` = 'generic' | 'salesDropdown')
 *     - `pagination` (`limit`, `offset`)
 * - `sanitizeFields`: Trims and sanitizes fields like `keyword`
 * - `validate`: Validates `normalizedQuery` via `packagingMaterialLookupQuerySchema`
 * - `getPackagingMaterialLookupController`: Handles the request and returns formatted options
 *
 * Query Parameters (after normalization):
 * - `filters`: {
 *     statusId?: UUID,
 *     createdBy?: UUID,
 *     updatedBy?: UUID,
 *     restrictToUnarchived?: boolean
 *   }
 * - `keyword`: string — Optional fuzzy search against name/color/size/material_composition
 * - `options`: {
 *     mode?: 'generic'|'salesDropdown'  // Sales mode hard-codes visibility/active-only constraints
 *   }
 * - `limit`: number — Optional pagination limit (default: 50)
 * - `offset`: number — Optional pagination offset
 *
 * Response (200 OK):
 * {
 *   success: true,
 *   message: 'Successfully retrieved packaging material lookup',
 *   items: Array<{ id: string, label: string }>,
 *   limit: number,
 *   offset: number,
 *   hasMore: boolean
 * }
 *
 * @access Protected
 * @permission Requires `view_packaging_material_lookup`
 */
router.get(
  '/packaging-materials',
  authorize([PERMISSIONS.VIEW_PACKAGING_MATERIAL]),
  createQueryNormalizationMiddleware(
    '', // moduleKey
    [], // arrayKeys
    [''], // booleanKeys under filters
    ['keyword'], // keys to lift to root (keyword)
    { includePagination: true, includeSorting: false },
    [''], // options.* keys to normalize
    ['mode']
  ),
  sanitizeFields(['keyword']),
  validate(
    packagingMaterialLookupQuerySchema,
    'query',
    { abortEarly: false, convert: true },
    'Invalid query parameters.'
  ),
  getPackagingMaterialLookupController
);

/**
 * Registers a standardized lookup route on an Express router.
 *
 * This helper delegates route construction to `createLookupRoute`
 * and attaches the resulting middleware chain to the router.
 *
 * Ensures consistent registration of lookup endpoints across modules.
 *
 * ------------------------------------------------------------------
 * Typical Use Case
 * ------------------------------------------------------------------
 * Used for dropdown / autocomplete endpoints such as:
 * - suppliers, manufacturers
 * - batch statuses
 * - users, roles
 * - products, SKUs
 *
 * ------------------------------------------------------------------
 * @param {import('express').Router} router
 *   Express router instance
 *
 * @param {object} config
 * @param {string} config.path
 * @param {string[]} config.permission
 * @param {object} config.schema
 * @param {RequestHandler} config.controller
 *
 * @param {object} [config.config]
 *   Optional normalization overrides:
 *   - arrayKeys
 *   - booleanKeys
 *   - filterKeys
 *   - sanitizeFields
 *   - includePagination
 *   - includeSorting
 *
 * @returns {void}
 */
const registerLookupRoute = (router, config) => {
  const route = createLookupRoute(config);
  router.get(route.path, ...route.handlers);
};

//=========================================================
// SIMPLE LOOKUPS (Factory-based)
//=========================================================

/**
 * @route GET /lookups/suppliers
 * @description Retrieve supplier options for dropdowns and assignment selectors.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_supplier_lookup
 */
registerLookupRoute(router, {
  path: '/suppliers',
  permission: [PERMISSIONS.VIEW_SUPPLIER],
  schema: supplierLookupQuerySchema,
  controller: getSupplierLookupController,
});

/**
 * @route GET /lookups/manufacturers
 * @description Retrieve manufacturer options for dropdowns and assignment selectors.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_manufacturer_lookup
 */
registerLookupRoute(router, {
  path: '/manufacturers',
  permission: [PERMISSIONS.VIEW_MANUFACTURER],
  schema: manufacturerLookupQuerySchema,
  controller: getManufacturerLookupController,
});

/**
 * @route GET /lookups/users
 * @description Retrieve user options for assignment and ownership selection.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_user_lookup
 */
registerLookupRoute(router, {
  path: '/users',
  permission: [PERMISSIONS.VIEW_USER],
  schema: userLookupQuerySchema,
  controller: getUserLookupController,
});

/**
 * @route GET /lookups/roles
 * @description Retrieve role options for admin configuration and assignment.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_role_lookup
 */
registerLookupRoute(router, {
  path: '/roles',
  permission: [PERMISSIONS.VIEW_ROLE],
  schema: roleLookupQuerySchema,
  controller: getRoleLookupController,
});

/**
 * @route GET /lookups/location-types
 * @description Retrieve location type options for configuration and setup.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_location_type_lookup
 */
registerLookupRoute(router, {
  path: '/location-types',
  permission: [PERMISSIONS.VIEW_LOCATION_TYPE],
  schema: locationTypeLookupQuerySchema,
  controller: getLocationTypeLookupController,
});

/**
 * @route GET /lookups/batch-statuses
 * @description Retrieve batch lifecycle statuses for workflow and dropdown usage.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_batch_status_lookup
 */
registerLookupRoute(router, {
  path: '/batch-statuses',
  permission: [PERMISSIONS.VIEW_BATCH_STATUS],
  schema: batchStatusLookupQuerySchema,
  controller: getBatchStatusLookupController,
});

/**
 * @route GET /lookups/statuses
 * @description Retrieve generic system status values for dropdowns.
 * Supports keyword search, name filter, and active status filtering.
 * @access Protected
 * @permission view_status_lookup
 */
registerLookupRoute(router, {
  path: '/statuses',
  permission: [PERMISSIONS.VIEW_STATUS],
  schema: statusLookupQuerySchema,
  controller: getStatusLookupController,
  config: {
    booleanKeys: ['is_active'],
    filterKeys: ['name', 'keyword', 'is_active'],
    sanitizeFields: ['name', 'keyword'],
  },
});

/**
 * @route GET /lookups/products
 * @description Retrieve product options for dropdowns and selection fields.
 * Supports filtering by brand, category, series, and keyword.
 * @access Protected
 * @permission view_product_lookup
 */
registerLookupRoute(router, {
  path: '/products',
  permission: [PERMISSIONS.VIEW_PRODUCT],
  schema: productLookupQuerySchema,
  controller: getProductLookupController,
  config: {
    filterKeys: ['keyword', 'brand', 'category', 'series'],
    sanitizeFields: ['brand', 'category', 'series'],
  },
});

/**
 * @route GET /lookups/sku-code-bases
 * @description Retrieve SKU code base definitions for SKU generation and setup.
 * Supports filtering by brand code, category code, and keyword.
 * @access Protected
 * @permission view_sku_code_base_lookup
 */
registerLookupRoute(router, {
  path: '/sku-code-bases',
  permission: [PERMISSIONS.VIEW_SKU_CODE_BASE],
  schema: skuCodeBaseLookupQuerySchema,
  controller: getSkuCodeBaseLookupController,
  config: {
    filterKeys: ['keyword', 'brand_code', 'category_code'],
  },
});

/**
 * @route GET /lookups/payment-methods
 * @description Retrieve payment method options for order and billing workflows.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_payment_method_lookup
 */
registerLookupRoute(router, {
  path: '/payment-methods',
  permission: [PERMISSIONS.VIEW_PAYMENT_METHOD],
  schema: paymentMethodLookupQuerySchema,
  controller: getPaymentMethodLookupController,
});

/**
 * @route GET /lookups/discounts
 * @description Retrieve discount options for pricing and order calculations.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_discount_lookup
 */
registerLookupRoute(router, {
  path: '/discounts',
  permission: [PERMISSIONS.VIEW_DISCOUNT],
  schema: discountLookupQuerySchema,
  controller: getDiscountLookupController,
});

/**
 * @route GET /lookups/tax-rates
 * @description Retrieve tax rate options for order pricing and compliance.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_tax_rate_lookup
 */
registerLookupRoute(router, {
  path: '/tax-rates',
  permission: [PERMISSIONS.VIEW_TAX_RATE],
  schema: taxRateLookupQuerySchema,
  controller: getTaxRateLookupController,
});

/**
 * @route GET /lookups/delivery-methods
 * @description Retrieve delivery method options for shipping and fulfillment.
 * Supports keyword search, pagination, and pickup location filtering.
 * @access Protected
 * @permission view_delivery_method_lookup
 */
registerLookupRoute(router, {
  path: '/delivery-methods',
  permission: [PERMISSIONS.VIEW_DELIVERY_METHOD],
  schema: deliveryMethodLookupQuerySchema,
  controller: getDeliveryMethodLookupController,
  config: {
    booleanKeys: ['isPickupLocation'],
  },
});

/**
 * @route GET /lookups/packaging-material-suppliers
 * @description Retrieve packaging material supplier options for dropdowns and autocomplete.
 * Supports keyword search and pagination.
 * @access Protected
 * @permission view_packaging_material_supplier_lookup
 */
registerLookupRoute(router,{
  path: '/packaging-material-suppliers',
  permission: [PERMISSIONS.VIEW_PACKAGING_MATERIAL_SUPPLIER],
  schema: packagingMaterialSupplierLookupQuerySchema,
  controller: getPackagingMaterialSupplierLookupController,
  config: {
    booleanKeys: ['isPreferred'],
    filterKeys: ['keyword'],
  },
});

module.exports = router;
