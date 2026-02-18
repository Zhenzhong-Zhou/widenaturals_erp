/**
 * @fileoverview manufacturer.constants.js
 *
 * Permission constants for Manufacturer domain.
 *
 * These constants define all ACL keys related to manufacturer
 * visibility, lookup shaping, and mutating operations.
 *
 * Design principles:
 * - Separate mutation vs visibility vs lookup capabilities
 * - Allow fine-grained JOIN control in lookup queries
 * - Support administrative override patterns
 * - Maintain naming symmetry with USER_CONSTANTS
 */

const MANUFACTURER_CONSTANTS = {
  PERMISSIONS: {
    // -------------------------------------------------
    // Manufacturer creation & lifecycle (mutating)
    // -------------------------------------------------

    CREATE_MANUFACTURERS: 'create_manufacturers',
    // Allows creating new manufacturer records

    UPDATE_MANUFACTURERS: 'update_manufacturers',
    // Allows editing manufacturer metadata

    ARCHIVE_MANUFACTURERS: 'archive_manufacturers',
    // Allows setting is_archived = true

    RESTORE_MANUFACTURERS: 'restore_manufacturers',
    // Allows restoring archived manufacturers

    DELETE_MANUFACTURERS: 'delete_manufacturers',
    // Hard delete (if supported by system policy)

    // -------------------------------------------------
    // Visibility controls (read-only)
    // -------------------------------------------------

    VIEW_ARCHIVED_MANUFACTURERS: 'view_archived_manufacturers',
    // Allows viewing archived manufacturer records

    VIEW_INACTIVE_MANUFACTURERS: 'view_inactive_manufacturers',
    // Allows viewing manufacturers not in ACTIVE status

    VIEW_ALL_MANUFACTURERS_VISIBILITY: 'view_all_manufacturers_visibility',
    // Full visibility override for read-only contexts

    VIEW_MANUFACTURER_LOCATIONS: 'view_manufacturer_locations',
    // Allows viewing linked location metadata

    // -------------------------------------------------
    // Lookup & search capabilities (read-only, scoped)
    // -------------------------------------------------

    SEARCH_MANUFACTURERS_BY_STATUS: 'search_manufacturers_by_status',
    // Enables keyword search on status name (JOIN status)

    SEARCH_MANUFACTURERS_BY_LOCATION: 'search_manufacturers_by_location',
    // Enables keyword search on location name (JOIN locations)

    // -------------------------------------------------
    // Administrative capabilities
    // -------------------------------------------------

    MANAGE_MANUFACTURERS: 'manage_manufacturers',
    // High-level mutation permission (create/update/archive)

    ADMIN_OVERRIDE_MANUFACTURER_FILTERS: 'admin_override_manufacturer_filters',
    // Allows bypassing standard visibility filters
  },
};

module.exports = {
  MANUFACTURER_CONSTANTS,
};
