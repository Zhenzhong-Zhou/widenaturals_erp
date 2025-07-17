const express = require('express');
const {
  getBatchRegistryLookupController,
  getWarehouseLookupController,
  getLotAdjustmentLookupController,
  fetchCustomerLookupController,
  getCustomerAddressLookupController, getOrderTypeLookupController,
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
  lotAdjustmentTypeLookupSchema, orderTypeLookupQuerySchema,
} = require('../validators/lookup-validators');

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
  authorize(['view_batch_registry_dropdown']),
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
    ['excludeInternal', 'restrictToQtyAdjustment'],
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
  authorize(['view_customer']),
  createQueryNormalizationMiddleware(
    '',                         // moduleKey (optional for sorting)
    [],                           // arrayKeys (e.g., ['statusId'] if needed)
    [],                           // booleanKeys (e.g., ['includeArchived'])
    ['keyword'],                  // filterKeys: what to extract into `filters`
    { includePagination: true, includeSorting: false }   // enable pagination normalization
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
  authorize(['view_customer']),
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
  authorize(['create_orders']),
  createQueryNormalizationMiddleware(
    '',
    [],
    [],
    orderTypeLookupQuerySchema
  ),
  sanitizeFields(['keyword']),
  validate(
    orderTypeLookupQuerySchema,
    'query',
    { convert: true },
    'Invalid query parameters.'
  ),
  getOrderTypeLookupController
);

module.exports = router;
