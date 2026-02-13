/**
 * Batch permission constants.
 *
 * Scope:
 * - Batch registry visibility
 * - Product batch & packaging batch operational views
 * - Batch metadata exposure
 * - Search and audit tooling
 *
 * Design principles:
 * - Single authority domain for all batch-related permissions
 * - READ visibility is separate from MUTATING actions
 * - Registry-level permissions are reused by model-specific views
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
    // Visibility controls (read-only)
    // -------------------------------------------------
    
    VIEW_PRODUCT_BATCHES: 'view_product_batches',
    // Can view product batches (registry + product batch pages)
    
    VIEW_PACKAGING_BATCHES: 'view_packaging_batches',
    // Can view packaging material batches
    
    VIEW_BATCH_MANUFACTURER: 'view_batch_manufacturer',
    // Can view manufacturer metadata linked to product batches
    
    VIEW_BATCH_SUPPLIER: 'view_batch_supplier',
    // Can view supplier metadata linked to packaging batches
    
    VIEW_BATCH_ALL_VISIBILITY: 'view_all_batches_visibility',
    // Full read-only visibility override across ALL batch views
    
    // -------------------------------------------------
    // Product batch–specific search & metadata exposure
    // (used by product batch list pages)
    // -------------------------------------------------
    
    SEARCH_PRODUCT_BATCH_BY_SKU: 'search_product_batch_by_sku',
    // Allows keyword search on SKU code
    
    SEARCH_PRODUCT_BATCH_BY_MANUFACTURER:
      'search_product_batch_by_manufacturer',
    // Allows keyword search on manufacturer name
    
    // -------------------------------------------------
    // Registry / cross-batch search capabilities
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
    // Administrative overrides
    // -------------------------------------------------
    
    ADMIN_OVERRIDE_BATCH_FILTERS: 'admin_override_batch_filters',
    // Allows bypassing visibility constraints (audit / support)
  },
};

module.exports = {
  BATCH_CONSTANTS,
};
