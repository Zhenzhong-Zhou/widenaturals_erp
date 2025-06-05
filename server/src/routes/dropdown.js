const express = require('express');
const {
  getBatchRegistryDropdownController,
  getWarehouseDropdownController, getLotAdjustmentDropdownController,
} = require('../controllers/dropdown-controller');
const authorize = require('../middlewares/authorize');
const { sanitizeInput } = require('../middlewares/sanitize');

const router = express.Router();

/**
 * @route GET /dropdown/batch-registry
 * @desc Fetch dropdown options for batch registry records.
 *       Supports filters like batch type and exclusion criteria, with pagination.
 *       Used to populate batch selection menus in inventory forms.
 * @access Protected
 * @permission Requires 'view_batch_registry_dropdown' and 'access_inventory_utilities'
 */
router.get(
  '/batch-registry',
  authorize(['view_batch_registry_dropdown', 'access_inventory_utilities']),
  sanitizeInput,
  getBatchRegistryDropdownController
);

/**
 * GET /dropdown/warehouses
 *
 * Returns a filtered list of warehouses for dropdown use.
 *
 * Query Parameters:
 * - locationTypeId (optional): Filter warehouses by location type
 * - warehouseTypeId (optional): Filter warehouses by warehouse type
 * - includeArchived (optional): Include archived warehouses if true
 *
 * Permissions Required:
 * - view_batch_registry_dropdown
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
    'view_batch_registry_dropdown',
    'access_inventory_utilities'
  ]),
  sanitizeInput,
  getWarehouseDropdownController
);

/**
 * @route GET /lot-adjustment-types
 * @description Retrieves active lot adjustment types for dropdown selection.
 * Supports optional filtering to exclude internal-only types via query param `?excludeInternal=true`.
 * Requires one of the following permissions:
 * - 'manage_inventory'
 * - 'view_batch_registry_dropdown'
 * - 'access_inventory_utilities'
 *
 * @access Protected
 * @returns {200} Array of dropdown options:
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
    'view_batch_registry_dropdown',
    'access_inventory_utilities'
  ]),
  sanitizeInput,
  getLotAdjustmentDropdownController
);

module.exports = router;
