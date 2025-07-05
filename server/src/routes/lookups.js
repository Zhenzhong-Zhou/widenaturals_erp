const express = require('express');
const {
  getBatchRegistryLookupController,
  getWarehouseLookupController,
  getLotAdjustmentLookupController,
  fetchCustomerLookupController,
} = require('../controllers/lookup-controller');
const authorize = require('../middlewares/authorize');
const { sanitizeInput } = require('../middlewares/sanitize');
const validate = require('../middlewares/validate');
const { customerLookupQuerySchema } = require('../validators/lookup-validators');

const router = express.Router();

/**
 * @route GET /lookups/batch-registry
 * @desc Lookup batch registry options for form filters and dropdowns.
 *       Supports filters like batch type and exclusion criteria, with pagination.
 *       Used to populate batch selection menus in inventory forms.
 * @access Protected
 * @permission Requires 'view_batch_registry_dropdown' and 'access_inventory_utilities'
 */
router.get(
  '/batch-registry',
  authorize(['view_batch_registry_dropdown', 'access_inventory_utilities']),
  sanitizeInput,
  getBatchRegistryLookupController
);

/**
 * GET /lookups/warehouses
 *
 * @desc Lookup warehouse records for UI dropdowns and filters.
 *       Supports filtering by locationTypeId, warehouseTypeId, and includeArchived.
 *
 * Query Parameters:
 * - locationTypeId (optional): Filter warehouses by location type
 * - warehouseTypeId (optional): Filter warehouses by warehouse type
 * - includeArchived (optional): Include archived warehouses if true
 *
 * Permissions Required:
 * - view_batch_registry_lookup
 * - access_inventory_utilities
 *
 * Middleware:
 * - authorize: Ensures the user has the required permissions
 *
 * Response:
 * 200 OK
 * {
 *   success: true,
 *   data: [
 *     {
 *       value: string,            // warehouse_id
 *       label: string,            // formatted name (e.g., "Main Warehouse (Toronto)")
 *       metadata: {
 *         locationId: string,
 *         locationName: string,
 *         locationTypeId: string,
 *         warehouseTypeName: string | null,
 *         statusId: string
 *       }
 *     },
 *     ...
 *   ],
 * }
 */
router.get(
  '/warehouses',
  authorize([
    'view_batch_registry_lookup',
    'access_inventory_utilities'
  ]),
  sanitizeInput,
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
  authorize([
    'manage_inventory',
    'view_batch_registry_lookup',
    'access_inventory_utilities'
  ]),
  sanitizeInput,
  getLotAdjustmentLookupController
);

/**
 * GET /lookup/customer-addresses
 *
 * Endpoint to retrieve paginated customer lookup data for dropdown/autocomplete.
 *
 * Query parameters:
 * - keyword: Optional string for partial search (default: '').
 * - limit: Optional integer for max records to return (default: 50, max: 100).
 * - offset: Optional integer for pagination offset (default: 0).
 *
 * Authorization: Requires 'view_customer' permission.
 *
 * Middlewares:
 * - authorize: Checks user permission.
 * - sanitizeInput: Sanitizes incoming query params.
 * - validate: Validates query params against customerLookupQuerySchema.
 *
 * Response:
 * 200 OK with JSON { success, message, data (lookup result + pagination info) }
 */
router.get(
  '/lookup/customers',
  authorize(['view_customer']),
  sanitizeInput,
  validate(
    customerLookupQuerySchema,
    'query',
    {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    },
    'Invalid query parameters.'
  ),
  fetchCustomerLookupController
);

module.exports = router;
