/**
 * @file inventory-status-constants.js
 * @description ACL-layer constants for the inventory_status domain.
 *
 * Houses business-layer permission strings consumed by visibility
 * evaluators (e.g., evaluateInventoryStatusLookupVisibility). Route-level
 * permissions live separately in permission-keys.js — this file is
 * intentionally distinct so business-layer ACL checks don't leak into
 * route wiring.
 *
 * Exports:
 *  - INVENTORY_STATUS_CONSTANTS — namespaced constants for the domain
 *      • PERMISSIONS.VIEW_ALL_INVENTORY_STATUS — bypasses the active-only filter
 */

'use strict';

const INVENTORY_STATUS_CONSTANTS = {
  PERMISSIONS: {
    VIEW_ALL_INVENTORY_STATUS: 'view_all_inventory_status',
  },
};

module.exports = {
  INVENTORY_STATUS_CONSTANTS,
};
