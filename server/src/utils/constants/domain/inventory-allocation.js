/**
 * @file inventory-allocation.js
 * @description Constants for the inventory allocation domain.
 */

'use strict';

const INVENTORY_ALLOCATION_CONSTANTS = {
  PERMISSIONS: {
    // -------------------------------------------------
    // Allocation visibility
    // -------------------------------------------------

    /**
     * Allows viewing all inventory allocation records
     * across all warehouses.
     *
     * Without this, the user is restricted to allocations
     * belonging to their assigned warehouses.
     */
    VIEW_ALL_ALLOCATIONS: 'view_all_inventory_allocations',

    // -------------------------------------------------
    // Allocation operations
    // -------------------------------------------------

    /**
     * Allows reassigning an allocation to a different warehouse.
     */
    REASSIGN_ALLOCATION: 'reassign_inventory_allocation',
  },
};

module.exports = {
  INVENTORY_ALLOCATION_CONSTANTS,
};
