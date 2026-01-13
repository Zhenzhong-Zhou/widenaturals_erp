const express = require('express');
const { authorize } = require('../middlewares/authorize');
const {
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
} = require('../validators/lookup-validators');
const { PERMISSIONS } = require('../utils/constants/domain/lookup-constants');

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
  fetchCustomerLookupController
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
 * GET /lookups/payment-methods
 *
 * Retrieves a paginated list of payment methods for use in dropdowns or lookup components.
 * Applies role-based access control and keyword-based filtering, and respects pagination params.
 *
 * Middleware Stack:
 * - `authorize(['view_payment_method_lookup'])`: Ensures user has lookup permission
 * - `createQueryNormalizationMiddleware(...)`: Extracts and normalizes query parameters:
 *    - `filters.keyword` (for search)
 *    - `pagination.limit`, `pagination.offset`
 * - `sanitizeFields(['keyword'])`: Trims and sanitizes the keyword field
 * - `validate(paymentMethodLookupQuerySchema, 'query', ...)`: Validates query against Joi schema
 * - `getPaymentMethodLookupController`: Fetches results using service → business → repo → transform
 *
 * Query Parameters:
 * @query {string} [keyword] - Optional keyword to search by name/code (if permitted)
 * @query {number} [limit=50] - Number of records per page (1–100)
 * @query {number} [offset=0] - Pagination offset (≥ 0)
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
 */
router.get(
  '/payment-methods',
  authorize([PERMISSIONS.VIEW_PAYMENT_METHOD]),
  createQueryNormalizationMiddleware(
    '', // moduleKey (optional for sorting)
    [], // arrayKeys (e.g., ['statusId'] if needed)
    [], // booleanKeys (e.g., ['includeArchived'])
    ['keyword'], // filterKeys: what to extract into `filters`
    { includePagination: true, includeSorting: false } // enable pagination normalization
  ),
  sanitizeFields(['keyword']),
  validate(
    paymentMethodLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid query parameters.'
  ),
  getPaymentMethodLookupController
);

/**
 * @route GET /discounts
 * @description
 * Endpoint to fetch paginated discount lookup options for dropdowns or selectors.
 * Applies permission checks, query normalization, field sanitization, validation, and filtering.
 *
 * Middleware chain includes:
 * - `authorize`: Enforces user permission to view discount lookups
 * - `createQueryNormalizationMiddleware`: Extracts and structures query parameters (e.g., filters, keyword, pagination)
 * - `sanitizeFields`: Trims and sanitizes specific fields (e.g., `keyword`)
 * - `validate`: Validates the normalized query against `discountLookupQuerySchema`
 * - `getDiscountLookupController`: Handles the request and returns formatted discount options
 *
 * Query Parameters (after normalization):
 * - `filters.keyword` — Optional search keyword to match discount name/description
 * - `filters.statusId` — Optional status filter (maybe stripped based on access)
 * - `limit` — Pagination size (default: 50)
 * - `offset` — Pagination offset
 *
 * Response:
 * - `200 OK` with JSON:
 *   - `success` (boolean)
 *   - `message` (string)
 *   - `items` (array of `{ id, label, isActive, isValidToday }`)
 *   - `limit` (number)
 *   - `offset` (number)
 *   - `hasMore` (boolean)
 *
 * @access Protected
 * @permission Requires `view_discount_lookup` permission
 */
router.get(
  '/discounts',
  authorize([PERMISSIONS.VIEW_DISCOUNT]),
  createQueryNormalizationMiddleware(
    '', // moduleKey (optional for sorting)
    [], // arrayKeys (e.g., ['statusId'] if needed)
    [], // booleanKeys (e.g., ['includeArchived'])
    ['keyword'], // filterKeys: what to extract into `filters`
    { includePagination: true, includeSorting: false } // enable pagination normalization
  ),
  sanitizeFields(['keyword']),
  validate(
    discountLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid query parameters.'
  ),
  getDiscountLookupController
);

/**
 * @route GET /tax-rates
 * @description
 * Endpoint to fetch paginated tax rate lookup options for dropdowns or selectors.
 * Applies permission checks, query normalization, field sanitization, validation, and filtering.
 *
 * Middleware chain includes:
 * - `authorize`: Enforces user permission to view tax rate lookups
 * - `createQueryNormalizationMiddleware`: Extracts and structures query parameters (e.g., filters, keyword, pagination)
 * - `sanitizeFields`: Trims and sanitizes specific fields (e.g., `keyword`)
 * - `validate`: Validates the normalized query against `taxRateLookupQuerySchema`
 * - `getTaxRateLookupController`: Handles the request and returns formatted tax rate options
 *
 * Query Parameters (after normalization):
 * - `filters.keyword` — Optional search keyword to match tax rate name/province
 * - `limit` — Pagination size (default: 50)
 * - `offset` — Pagination offset
 *
 * Response:
 * - `200 OK` with JSON:
 *   - `success` (boolean)
 *   - `message` (string)
 *   - `items` (array of `{ id, label, isActive }`)
 *   - `limit` (number)
 *   - `offset` (number)
 *   - `hasMore` (boolean)
 *
 * @access Protected
 * @permission Requires `view_tax_rate_lookup` permission
 */
router.get(
  '/tax-rates',
  authorize([PERMISSIONS.VIEW_TAX_RATE]),
  createQueryNormalizationMiddleware(
    '', // moduleKey (optional for sorting)
    [], // arrayKeys
    [], // booleanKeys
    ['keyword'], // filterKeys
    { includePagination: true, includeSorting: false }
  ),
  sanitizeFields(['keyword']),
  validate(
    taxRateLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid query parameters.'
  ),
  getTaxRateLookupController
);

/**
 * @route GET /delivery-methods
 * @description
 * Endpoint to fetch paginated delivery method lookup options for dropdowns or selectors.
 * Applies permission checks, query normalization, field sanitization, validation, and filtering.
 *
 * Middleware chain includes:
 * - `authorize`: Enforces user permission to view delivery method lookups
 * - `createQueryNormalizationMiddleware`: Extracts and structures query parameters (e.g., filters, keyword, pagination)
 * - `sanitizeFields`: Trims and sanitizes specific fields (e.g., `keyword`)
 * - `validate`: Validates the normalized query against `deliveryMethodLookupQuerySchema`
 * - `getDeliveryMethodLookupController`: Handles the request and returns formatted delivery method options
 *
 * Query Parameters (after normalization):
 * - `filters.keyword` — Optional search keyword to match method name or description
 * - `filters.isPickupLocation` — Optional boolean to filter by pickup location flag
 * - `limit` — Pagination size (default: 50)
 * - `offset` — Pagination offset
 *
 * Response:
 * - `200 OK` with JSON:
 *   - `success` (boolean)
 *   - `message` (string)
 *   - `items` (array of `{ id, label, isPickupLocation, isActive }`)
 *   - `limit` (number)
 *   - `offset` (number)
 *   - `hasMore` (boolean)
 *
 * @access Protected
 * @permission Requires `view_delivery_method_lookup` permission
 */
router.get(
  '/delivery-methods',
  authorize([PERMISSIONS.VIEW_DELIVERY_METHOD]),
  createQueryNormalizationMiddleware(
    '', // moduleKey (not needed here)
    [], // arrayKeys
    ['isPickupLocation'], // booleanKeys
    deliveryMethodLookupQuerySchema, // filterKeys
    { includePagination: true, includeSorting: false }
  ),
  sanitizeFields(['keyword']),
  validate(
    deliveryMethodLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid query parameters.'
  ),
  getDeliveryMethodLookupController
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
 * @route GET /sku-code-bases
 * @description
 * Endpoint to fetch paginated SKU Code Base lookup options for dropdowns or selectors.
 * Applies permission checks, query normalization, field sanitization, validation, and filtering.
 *
 * Middleware chain includes:
 * - `authorize`: Enforces user permission to view SKU Code Base lookups
 * - `createQueryNormalizationMiddleware`: Extracts and structures query parameters
 *     (e.g., filters, keyword, brand_code, pagination)
 * - `sanitizeFields`: Trims and sanitizes specific fields (e.g., `keyword`)
 * - `validate`: Validates the normalized query against `skuCodeBaseLookupQuerySchema`
 * - `getSkuCodeBaseLookupController`: Handles the request and returns formatted lookup options
 *
 * Query Parameters (after normalization):
 * - `filters.keyword` — Optional search keyword for brand/category
 * - `filters.brand_code` — Optional exact brand code filter
 * - `filters.category_code` — Optional exact category code filter
 * - `filters.status_id` — Optional status filter (maybe overridden based on permissions)
 * - `limit` — Pagination size (default: 50)
 * - `offset` — Pagination offset
 *
 * Response:
 * - `200 OK` with JSON:
 *   - `success` (boolean)
 *   - `message` (string)
 *   - `items` (array of `{ id, label, isActive }`)
 *   - `limit` (number)
 *   - `offset` (number)
 *   - `hasMore` (boolean)
 *
 * @access Protected
 * @permission Requires `view_sku_code_base_lookup` permission
 */
router.get(
  '/sku-code-bases',
  authorize([PERMISSIONS.VIEW_SKU_CODE_BASE]),
  createQueryNormalizationMiddleware(
    '', // moduleKey (optional)
    [], // arrayKeys (none needed for this lookup)
    [], // booleanKeys (none needed)
    ['keyword', 'brand_code', 'category_code'], // filterKeys
    { includePagination: true, includeSorting: false }
  ),
  sanitizeFields(['keyword']),
  validate(
    skuCodeBaseLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid SKU Code Base lookup query parameters.'
  ),
  getSkuCodeBaseLookupController
);

/**
 * @route GET /products
 * @description
 * Endpoint to fetch paginated **Product** lookup options for dropdowns or selectors.
 *
 * This lookup endpoint is intentionally lightweight and optimized for UI usage.
 * It applies:
 * - User permission checks
 * - Query normalization (filters, pagination)
 * - Field sanitization (e.g., trimming user input)
 * - Joi validation for safe filter/pagination values
 * - Service-level filtering + visibility rules (active-only for restricted users)
 *
 * Middleware chain includes:
 *
 * 1. `authorize`
 *    Ensures the user has permission to load product lookup lists.
 *
 * 2. `createQueryNormalizationMiddleware`
 *    Extracts raw query parameters and normalizes them into:
 *    {
 *      filters: { brand, category, series },
 *      limit,
 *      offset
 *    }
 *
 * 3. `sanitizeFields`
 *    Cleans input fields (e.g., trims whitespace).
 *
 * 4. `validate(productLookupQuerySchema)`
 *    Application-level validation ensuring predictable filter/pagination structure.
 *
 * 5. `getProductLookupController`
 *    Service-driven lookup returning:
 *    - `{ id, label, isActive? }` items
 *    - pagination metadata
 *
 *
 * ### Query Parameters (after normalization)
 * - `filters.brand`    — Optional partial brand filter
 * - `filters.category` — Optional partial category filter
 * - `filters.series`   — Optional partial series filter
 * - `limit`            — Page size (default: 50)
 * - `offset`           — Pagination offset
 *
 *
 * ### Response: 200 OK
 * ```json
 * {
 *   "success": true,
 *   "message": "Successfully retrieved Product lookup",
 *   "items": [{ "id": "...", "label": "...", "isActive": true }],
 *   "limit": 50,
 *   "offset": 0,
 *   "hasMore": true
 * }
 * ```
 *
 * @access Protected
 * @permission Requires `view_product_lookup` permission
 */
router.get(
  '/products',
  authorize([PERMISSIONS.VIEW_PRODUCT]),
  createQueryNormalizationMiddleware(
    '', // moduleKey not needed
    [], // arrayKeys none for dropdown
    [], // booleanKeys none
    ['keyword', 'brand', 'category', 'series'], // filterKeys
    { includePagination: true, includeSorting: false }
  ),
  sanitizeFields(['brand', 'category', 'series']),
  validate(
    productLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid Product lookup query parameters.'
  ),
  getProductLookupController
);

/**
 * @route GET /lookups/statuses
 * @description
 * Endpoint to fetch paginated **Status** lookup options for dropdowns or autocomplete.
 *
 * This endpoint is optimized for UI usage. It applies:
 * - User permission checks (via service layer)
 * - Query normalization (filters, pagination)
 * - Field sanitization (e.g., trim user input)
 * - Joi validation using `statusLookupQuerySchema`
 * - Service-level visibility rules (active-only for restricted users)
 *
 *
 * Middleware chain includes:
 *
 * 1. `authorize`
 *    Ensures the user has permission to load Status lookup lists.
 *
 * 2. `createQueryNormalizationMiddleware`
 *    Extracts raw query parameters and normalizes them into:
 *    {
 *      filters: { name, keyword, is_active },
 *      limit,
 *      offset
 *    }
 *
 * 3. `sanitizeFields`
 *    Trims user input for safety and consistent matching.
 *
 * 4. `validate(statusLookupQuerySchema)`
 *    Validates filter/pagination structure before service layer.
 *
 * 5. `getStatusLookupController`
 *    Fetches paginated lookup results:
 *    - `{ id, label, isActive }`
 *    - pagination metadata
 *
 *
 * ### Query Parameters (after normalization)
 * - `filters.name`      — Optional partial status name filter
 * - `filters.keyword`   — Optional fuzzy-match filter for name/description
 * - `filters.is_active` — Optional boolean; may be overridden by ACL
 * - `limit`             — Page size (default: 50)
 * - `offset`            — Pagination offset
 *
 *
 * ### Response: 200 OK
 * ```json
 * {
 *   "success": true,
 *   "message": "Successfully retrieved Status lookup",
 *   "items": [{ "id": "...", "label": "Active", "isActive": true }],
 *   "limit": 50,
 *   "offset": 0,
 *   "hasMore": true
 * }
 * ```
 *
 * @access Protected
 * @permission Requires `view_status_lookup` permission
 */
router.get(
  '/statuses',
  authorize([PERMISSIONS.VIEW_STATUS]),
  createQueryNormalizationMiddleware(
    '', // no moduleKey needed for lookup UIs
    [], // arrayKeys — none for Status lookup
    ['is_active'], // booleanKeys
    ['name', 'keyword', 'is_active'], // filterKeys for Status lookup
    { includePagination: true, includeSorting: false }
  ),
  sanitizeFields(['name', 'keyword']),
  validate(
    statusLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid Status lookup query parameters.'
  ),
  getStatusLookupController
);

/**
 * @route GET /users
 * @description
 * Endpoint to fetch paginated **User** lookup options for dropdowns,
 * autocomplete inputs, or assignment selectors.
 *
 * This lookup endpoint is intentionally lightweight and optimized for UI usage.
 * It applies:
 * - User permission checks
 * - Query normalization (filters, pagination)
 * - Field sanitization (e.g., trimming user input)
 * - Joi validation for safe filter/pagination values
 * - Service-level visibility rules (active-only, system/root exclusion)
 *
 * Middleware chain includes:
 *
 * 1. `authorize`
 *    Ensures the user has permission to load user lookup lists.
 *
 * 2. `createQueryNormalizationMiddleware`
 *    Extracts raw query parameters and normalizes them into:
 *    {
 *      filters: { keyword },
 *      limit,
 *      offset
 *    }
 *
 * 3. `sanitizeFields`
 *    Cleans input fields (e.g., trims whitespace).
 *
 * 4. `validate(userLookupQuerySchema)`
 *    Application-level validation ensuring predictable filter/pagination structure.
 *
 * 5. `getUserLookupController`
 *    Service-driven lookup returning:
 *    - `{ id, label, subLabel?, isActive? }` items
 *    - pagination metadata
 *
 *
 * ### Query Parameters (after normalization)
 * - `filters.keyword` — Optional fuzzy match on name or email
 * - `limit`           — Page size (default: 50)
 * - `offset`          — Pagination offset
 *
 *
 * ### Response: 200 OK
 * ```json
 * {
 *   "success": true,
 *   "message": "Successfully retrieved User lookup",
 *   "items": [
 *     {
 *       "id": "...",
 *       "label": "John Doe",
 *       "subLabel": "john@company.com",
 *       "isActive": true
 *     }
 *   ],
 *   "limit": 50,
 *   "offset": 0,
 *   "hasMore": true
 * }
 * ```
 *
 * @access Protected
 * @permission Requires `view_user_lookup` permission
 */
router.get(
  '/users',
  authorize([PERMISSIONS.VIEW_USER]),
  createQueryNormalizationMiddleware(
    '', // moduleKey not required for lookups
    [], // arrayKeys none
    [], // booleanKeys none
    ['keyword'], // filterKeys
    { includePagination: true, includeSorting: false }
  ),
  sanitizeFields(['keyword']),
  validate(
    userLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid User lookup query parameters.'
  ),
  getUserLookupController
);

/**
 * @route GET /lookups/roles
 * @description
 * Endpoint to fetch paginated **Role** lookup options for dropdowns,
 * assignment selectors, and admin configuration UIs.
 *
 * This endpoint is intentionally lightweight and permission-aware.
 * It applies:
 * - Role visibility ACL (active-only / full visibility)
 * - Query normalization (filters + pagination)
 * - Input sanitization
 * - Joi validation
 * - Service-driven lookup + UI transformation
 *
 * ### Query Parameters (after normalization)
 * - `filters.keyword` — Optional fuzzy match (name / description / role group)
 * - `limit`           — Page size (default: 50)
 * - `offset`          — Pagination offset
 *
 * ### Response: 200 OK
 * ```json
 * {
 *   "success": true,
 *   "message": "Successfully retrieved Role lookup",
 *   "items": [
 *     {
 *       "id": "...",
 *       "label": "Admin • System",
 *       "isActive": true
 *     }
 *   ],
 *   "limit": 50,
 *   "offset": 0,
 *   "hasMore": true
 * }
 * ```
 *
 * NOTE:
 * - Role lifecycle visibility (active vs inactive) and hierarchy scope
 *   are enforced exclusively in the service layer.
 * - Client-provided filters cannot override ACL rules.
 *
 * @access Protected
 * @permission Requires `view_role_lookup`
 */
router.get(
  '/roles',
  authorize([PERMISSIONS.VIEW_ROLE]),
  createQueryNormalizationMiddleware(
    '',
    [], // arrayKeys
    [], // booleanKeys
    ['keyword'], // filterKeys (keyword ONLY)
    { includePagination: true, includeSorting: false }
  ),
  sanitizeFields(['keyword']),
  validate(
    roleLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      convert: true,
    },
    'Invalid Role lookup query parameters.'
  ),
  getRoleLookupController
);

module.exports = router;
