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
     * Allows manually triggering inventory allocation
     * against an order.
     */
    CREATE_ALLOCATION: 'create_inventory_allocation',

    /**
     * Allows confirming a pending allocation.
     */
    CONFIRM_ALLOCATION: 'confirm_inventory_allocation',

    /**
     * Allows cancelling an active allocation.
     */
    CANCEL_ALLOCATION: 'cancel_inventory_allocation',

    /**
     * Allows processing an allocation return.
     */
    RETURN_ALLOCATION: 'return_inventory_allocation',

    /**
     * Allows reassigning an allocation to a different warehouse.
     */
    REASSIGN_ALLOCATION: 'reassign_inventory_allocation',
  },
};

module.exports = {
  INVENTORY_ALLOCATION_CONSTANTS,
};
