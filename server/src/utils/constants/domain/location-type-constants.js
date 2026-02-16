/**
 * @fileoverview location-type-constants.js
 *
 * Permission constants for Location Type domain.
 *
 * Defines ACL keys controlling location type creation,
 * visibility rules, lookup shaping, and administrative overrides.
 *
 * Structure intentionally mirrors supplier, manufacturer,
 * and user domains for architectural consistency across ERP modules.
 */

const LOCATION_TYPE_CONSTANTS = {
  PERMISSIONS: {
    // -------------------------------------------------
    // Location Type creation & lifecycle (mutating)
    // -------------------------------------------------
    
    CREATE_LOCATION_TYPES: 'create_location_types',
    // Allows creating new location type records
    
    UPDATE_LOCATION_TYPES: 'update_location_types',
    // Allows editing location type metadata
    
    DELETE_LOCATION_TYPES: 'delete_location_types',
    // Hard delete (if enabled in policy)
    
    // -------------------------------------------------
    // Visibility controls (read-only)
    // -------------------------------------------------
    
    VIEW_INACTIVE_LOCATION_TYPES: 'view_inactive_location_types',
    // Allows viewing location types in non-ACTIVE status
    
    VIEW_ALL_LOCATION_TYPES_VISIBILITY:
      'view_all_location_types_visibility',
    // Full visibility override for read-only contexts
    // Allows viewing active + inactive location types
    
    // -------------------------------------------------
    // Lookup & search capabilities (read-only, scoped)
    // -------------------------------------------------
    
    SEARCH_LOCATION_TYPES_BY_STATUS:
      'search_location_types_by_status',
    // Enables keyword search on status name (JOIN status)
    
    // -------------------------------------------------
    // Administrative capabilities
    // -------------------------------------------------
    
    MANAGE_LOCATION_TYPES: 'manage_location_types',
    // High-level mutation permission
    
    ADMIN_OVERRIDE_LOCATION_TYPE_FILTERS:
      'admin_override_location_type_filters',
    // Allows bypassing standard repository visibility filters
  },
};

module.exports = {
  LOCATION_TYPE_CONSTANTS,
};
