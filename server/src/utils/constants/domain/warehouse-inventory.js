/**
 * @file warehouse-inventory.js
 * @description Constants for the warehouse inventory domain.
 */

'use strict';

const WAREHOUSE_INVENTORY_CONSTANTS = {
  PERMISSIONS: {
    // -------------------------------------------------
    // Warehouse scope
    // -------------------------------------------------

    /**
     * Grants visibility across all warehouses.
     *
     * Without this, the user is restricted to warehouses
     * listed in their assignment record.
     */
    VIEW_ALL_WAREHOUSES: 'view_all_warehouses',

    // -------------------------------------------------
    // Batch-type visibility
    // -------------------------------------------------

    /**
     * Grants visibility across all batch types
     * within accessible warehouses.
     */
    VIEW_ALL_BATCH_TYPES: 'view_all_warehouse_batch_types',

    /**
     * Allows viewing product batch inventory records.
     */
    VIEW_PRODUCT_INVENTORY: 'view_warehouse_product_inventory',

    /**
     * Allows viewing packaging batch inventory records.
     */
    VIEW_PACKAGING_INVENTORY: 'view_warehouse_packaging_inventory',

    // -------------------------------------------------
    // Field-level visibility
    // -------------------------------------------------

    /**
     * Allows viewing financial fields such as warehouse_fee.
     *
     * Typically restricted to finance, operations leads,
     * or administrative roles.
     */
    VIEW_INVENTORY_FINANCIALS: 'view_warehouse_inventory_financials',

    /**
     * Allows viewing manufacturer details linked to
     * product batch inventory records.
     */
    VIEW_INVENTORY_MANUFACTURER: 'view_warehouse_inventory_manufacturer',

    /**
     * Allows viewing supplier details linked to
     * packaging batch inventory records.
     */
    VIEW_INVENTORY_SUPPLIER: 'view_warehouse_inventory_supplier',

    // -------------------------------------------------
    // Inventory operations
    // -------------------------------------------------

    /**
     * Allows recording inbound inventory (stock-in).
     */
    CREATE_INBOUND: 'create_warehouse_inbound',

    /**
     * Allows recording outbound inventory (stock-out).
     */
    CREATE_OUTBOUND: 'create_warehouse_outbound',

    /**
     * Allows adjusting inventory quantities
     * (corrections, write-offs, cycle count reconciliation).
     */
    ADJUST_INVENTORY: 'adjust_warehouse_inventory',

    /**
     * Allows reserving inventory against orders.
     */
    RESERVE_INVENTORY: 'reserve_warehouse_inventory',

    /**
     * Allows releasing reserved inventory back to available.
     */
    RELEASE_RESERVATION: 'release_warehouse_reservation',

    /**
     * Allows changing inventory status
     * (e.g., available → quarantined → damaged).
     */
    UPDATE_INVENTORY_STATUS: 'update_warehouse_inventory_status',

    /**
     * Allows transferring inventory between warehouses.
     */
    TRANSFER_INVENTORY: 'transfer_warehouse_inventory',
  },
};

module.exports = {
  WAREHOUSE_INVENTORY_CONSTANTS,
};
