/**
 * @file warehouse-constants.js
 * @description Constants for the warehouse domain.
 */

'use strict';

const WAREHOUSE_CONSTANTS = {
  PERMISSIONS: {
    // ── Scope ─────────────────────────────────────────────────────────────────
    
    /**
     * Grants visibility across all warehouses.
     *
     * Without this, the user is restricted to warehouses
     * listed in their assignment record.
     */
    VIEW_ALL: 'view_all_warehouses',
    
    // ── Visibility overrides ──────────────────────────────────────────────────
    
    /** Allows viewing archived warehouses. */
    VIEW_ARCHIVED: 'view_archived_warehouses',
    
    /** Allows viewing warehouses in any status, not just active. */
    VIEW_ALL_STATUSES: 'view_all_warehouse_statuses',
    
    // ── Mutations ─────────────────────────────────────────────────────────────
    
    /** Allows archiving a warehouse record. */
    ARCHIVE: 'archive_warehouse',
  },
};

module.exports = {
  WAREHOUSE_CONSTANTS,
};
