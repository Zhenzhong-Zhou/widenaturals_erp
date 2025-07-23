const express = require('express');
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
} = require('../controllers/lookup-controller');
const authorize = require('../middlewares/authorize');
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
  taxRateLookupQuerySchema, deliveryMethodLookupQuerySchema,
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
  authorize(['view_batch_registry_lookup']),
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
  authorize(['view_warehouse_lookup']),
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
  authorize(['view_lot_adjustment_type_lookup']),
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
  authorize(['view_customer_lookup']),
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
  '/address/by-customer',
  authorize(['view_customer_address_lookup']),
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
  authorize(['view_order_type_lookup']),
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
  authorize(['view_payment_method_lookup']),
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
    '',        // moduleKey (optional for sorting)
    [],        // arrayKeys
    [],        // booleanKeys
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
    '',                   // moduleKey (not needed here)
    [],                   // arrayKeys
    ['isPickupLocation'], // booleanKeys
    ['keyword', 'isPickupLocation'], // filterKeys
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

module.exports = router;
