/**
 * @fileoverview supplier.constants.js
 *
 * Permission constants for Supplier domain.
 *
 * Defines ACL keys controlling supplier creation,
 * visibility rules, lookup shaping, and administrative overrides.
 *
 * Structure intentionally mirrors manufacturer and user domains
 * for architectural consistency across ERP modules.
 */

const SUPPLIER_CONSTANTS = {
  PERMISSIONS: {
    // -------------------------------------------------
    // Supplier creation & lifecycle (mutating)
    // -------------------------------------------------

    CREATE_SUPPLIERS: 'create_suppliers',
    // Allows creating new supplier records

    UPDATE_SUPPLIERS: 'update_suppliers',
    // Allows editing supplier metadata

    ARCHIVE_SUPPLIERS: 'archive_suppliers',
    // Allows setting is_archived = true

    RESTORE_SUPPLIERS: 'restore_suppliers',
    // Allows restoring archived suppliers

    DELETE_SUPPLIERS: 'delete_suppliers',
    // Hard delete (if enabled in policy)

    // -------------------------------------------------
    // Visibility controls (read-only)
    // -------------------------------------------------

    VIEW_ARCHIVED_SUPPLIERS: 'view_archived_suppliers',
    // Allows viewing archived supplier records

    VIEW_INACTIVE_SUPPLIERS: 'view_inactive_suppliers',
    // Allows viewing non-ACTIVE suppliers

    VIEW_ALL_SUPPLIERS_VISIBILITY: 'view_all_suppliers_visibility',
    // Full visibility override for read-only contexts

    VIEW_SUPPLIER_LOCATIONS: 'view_supplier_locations',
    // Allows viewing linked location metadata

    // -------------------------------------------------
    // Lookup & search capabilities (read-only, scoped)
    // -------------------------------------------------

    SEARCH_SUPPLIERS_BY_STATUS: 'search_suppliers_by_status',
    // Enables keyword search on status name (JOIN status)

    SEARCH_SUPPLIERS_BY_LOCATION: 'search_suppliers_by_location',
    // Enables keyword search on location name (JOIN locations)

    // -------------------------------------------------
    // Administrative capabilities
    // -------------------------------------------------

    MANAGE_SUPPLIERS: 'manage_suppliers',
    // High-level mutation permission

    ADMIN_OVERRIDE_SUPPLIER_FILTERS: 'admin_override_supplier_filters',
    // Allows bypassing standard repository visibility filters
  },
};

module.exports = {
  SUPPLIER_CONSTANTS,
};
