/**
 * Batch permission constants.
 *
 * Defines all permission keys related to batch operations within the ERP.
 *
 * Scope includes:
 * - Batch creation and lifecycle management
 * - Product batch metadata editing
 * - Packaging material batch metadata editing
 * - Batch visibility and read-only access
 * - Search capabilities across batch registries
 * - Administrative overrides for support and audit purposes
 *
 * Design principles:
 *
 * 1. All batch-related permissions are centralized in a single domain.
 * 2. READ visibility is separated from MUTATING operations.
 * 3. Permissions are granular to support RBAC across different roles
 *    (warehouse, QA, operations, admin).
 * 4. Root-level users may bypass permission checks through application logic.
 *
 * NOTE:
 * This module only defines permission identifiers. Enforcement must be
 * implemented in the authorization layer of the application.
 */

const BATCH_CONSTANTS = {
  PERMISSIONS: {
    
    // -------------------------------------------------
    // Batch creation & lifecycle operations
    // -------------------------------------------------
    
    /**
     * Allows registering new product batches.
     *
     * Example:
     * Manufacturing batches received from production.
     */
    CREATE_PRODUCT_BATCHES: 'create_product_batches',
    
    /**
     * Allows registering packaging material batches.
     *
     * Example:
     * Packaging materials received from suppliers.
     */
    CREATE_PACKAGING_BATCHES: 'create_packaging_batches',
    
    /**
     * Global permission for updating batch lifecycle state.
     *
     * Typical states include:
     * pending → received → quarantined → released → consumed
     *
     * Some systems may combine this with model-specific permissions.
     */
    UPDATE_BATCH_STATUS: 'update_batch_status',
    
    /**
     * Allows archiving batches.
     *
     * Archiving typically removes batches from active operational views
     * while preserving them for historical audit.
     */
    ARCHIVE_BATCHES: 'archive_batches',
    
    // -------------------------------
    // Product batch metadata editing
    // -------------------------------
    
    /**
     * Allows editing non-sensitive product batch metadata.
     */
    EDIT_PRODUCT_BATCH_METADATA_BASIC:
      'edit_product_batch_metadata_basic',
    
    /**
     * Allows editing sensitive product batch fields
     * such as quantities or operational timestamps.
     */
    EDIT_PRODUCT_BATCH_METADATA_SENSITIVE:
      'edit_product_batch_metadata_sensitive',
    
    /**
     * Allows editing release metadata
     * used during QA approval.
     */
    EDIT_PRODUCT_BATCH_RELEASE_METADATA:
      'edit_product_batch_release_metadata',
    
    /**
     * Allows changing product batch lifecycle status.
     */
    CHANGE_PRODUCT_BATCH_STATUS:
      'change_product_batch_status',
    
    // -------------------------------
    // Packaging batch metadata editing
    // -------------------------------
    
    /**
     * Allows editing basic packaging batch metadata.
     */
    EDIT_PACKAGING_BATCH_METADATA_BASIC:
      'edit_packaging_batch_metadata_basic',
    
    /**
     * Allows editing sensitive packaging metadata
     * such as supplier references or financial fields.
     */
    EDIT_PACKAGING_BATCH_METADATA_SENSITIVE:
      'edit_packaging_batch_metadata_sensitive',
    
    /**
     * Allows changing packaging batch lifecycle state.
     */
    CHANGE_PACKAGING_BATCH_STATUS:
      'change_packaging_batch_status',
    
    // -------------------------------------------------
    // Batch visibility (read-only access)
    // -------------------------------------------------
    
    /**
     * Allows viewing product batch records.
     */
    VIEW_PRODUCT_BATCHES: 'view_product_batches',
    
    /**
     * Allows viewing packaging material batches.
     */
    VIEW_PACKAGING_BATCHES: 'view_packaging_batches',
    
    /**
     * Allows viewing manufacturer information
     * linked to product batches.
     */
    VIEW_BATCH_MANUFACTURER: 'view_batch_manufacturer',
    
    /**
     * Allows viewing supplier metadata linked to
     * packaging material batches.
     */
    VIEW_BATCH_SUPPLIER: 'view_batch_supplier',
    
    /**
     * Grants full read-only visibility across all batch data.
     *
     * Useful for administrative users or support roles.
     */
    VIEW_BATCH_ALL_VISIBILITY: 'view_all_batches_visibility',
    
    // -------------------------------------------------
    // Product batch search capabilities
    // -------------------------------------------------
    
    /**
     * Allows searching product batches by SKU code.
     */
    SEARCH_PRODUCT_BATCH_BY_SKU: 'search_product_batch_by_sku',
    
    /**
     * Allows searching product batches by manufacturer.
     */
    SEARCH_PRODUCT_BATCH_BY_MANUFACTURER:
      'search_product_batch_by_manufacturer',
    
    // -------------------------------------------------
    // Cross-batch registry search capabilities
    // -------------------------------------------------
    
    /**
     * Allows searching batches by lot number.
     */
    SEARCH_BATCH_BY_LOT: 'search_batch_by_lot',
    
    /**
     * Allows searching batches by product name or SKU.
     */
    SEARCH_BATCH_BY_PRODUCT: 'search_batch_by_product',
    
    /**
     * Allows searching packaging batches by material name or code.
     */
    SEARCH_BATCH_BY_MATERIAL: 'search_batch_by_material',
    
    /**
     * Allows searching batches by supplier.
     */
    SEARCH_BATCH_BY_SUPPLIER: 'search_batch_by_supplier',
    
    // -------------------------------------------------
    // Administrative override capabilities
    // -------------------------------------------------
    
    /**
     * Allows bypassing visibility restrictions.
     *
     * Intended for support engineers, auditors,
     * or administrators investigating system issues.
     */
    ADMIN_OVERRIDE_BATCH_FILTERS: 'admin_override_batch_filters',
  },
};

module.exports = {
  BATCH_CONSTANTS,
};
