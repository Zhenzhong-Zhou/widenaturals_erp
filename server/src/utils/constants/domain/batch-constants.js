/**
 * Batch Registry permission constants.
 *
 * Scope:
 * - Batch registry visibility
 * - Batch metadata access
 * - Batch creation & lifecycle management (future)
 *
 * Design principles:
 * - READ visibility permissions are separate from MUTATING permissions
 * - Full visibility override exists for audit / admin tooling
 * - Root users implicitly bypass all restrictions
 */

const BATCH_CONSTANTS = {
  PERMISSIONS: {
    // -------------------------------------------------
    // Batch creation & lifecycle (mutating actions)
    // -------------------------------------------------
    
    CREATE_PRODUCT_BATCHES: 'create_product_batches',
    // Allows registering new product batches
    
    CREATE_PACKAGING_BATCHES: 'create_packaging_batches',
    // Allows registering new packaging material batches
    
    UPDATE_BATCH_STATUS: 'update_batch_status',
    // Allows changing batch status (e.g. released, quarantined, expired)
    
    ARCHIVE_BATCHES: 'archive_batches',
    // Allows archiving or soft-removing batches from active views
    
    // -------------------------------------------------
    // Visibility controls (read-only access)
    // -------------------------------------------------
    
    VIEW_PRODUCT_BATCHES: 'view_product_batches',
    // Allows viewing product batches in batch registry
    
    VIEW_PACKAGING_BATCHES: 'view_packaging_batches',
    // Allows viewing packaging material batches in batch registry
    
    VIEW_BATCH_MANUFACTURER: 'view_batch_manufacturer',
    // Allows viewing manufacturer metadata linked to product batches
    
    VIEW_BATCH_SUPPLIER: 'view_batch_supplier',
    // Allows viewing supplier metadata linked to packaging batches
    
    VIEW_BATCH_ALL_VISIBILITY: 'view_all_batches_visibility',
    // Full visibility override (read-only):
    // Can view all batch types and all related metadata
    // Supersedes all other batch visibility permissions
    
    // -------------------------------------------------
    // Lookup & search capabilities (read-only, scoped)
    // -------------------------------------------------
    
    SEARCH_BATCH_BY_LOT: 'search_batch_by_lot',
    // Allows keyword search on lot numbers
    
    SEARCH_BATCH_BY_PRODUCT: 'search_batch_by_product',
    // Allows keyword search on product name / SKU
    
    SEARCH_BATCH_BY_MATERIAL: 'search_batch_by_material',
    // Allows keyword search on packaging material name / code
    
    SEARCH_BATCH_BY_SUPPLIER: 'search_batch_by_supplier',
    // Allows keyword search on supplier name
    
    // -------------------------------------------------
    // Administrative overrides (read-only, high privilege)
    // -------------------------------------------------
    
    ADMIN_OVERRIDE_BATCH_FILTERS: 'admin_override_batch_filters',
    // Allows bypassing batch registry visibility constraints
    // Intended for audit, investigation, or support tooling only
  },
};

module.exports = {
  BATCH_CONSTANTS,
};
