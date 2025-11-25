const SKU_CODE_BASE_CONSTANTS = {
  PERMISSIONS: {
    VIEW_ALL_SKU_CODE_BASES: 'view_all_sku_code_bases',
    // Can view all SKU code base entries regardless of status
    
    VIEW_ACTIVE_SKU_CODE_BASES: 'view_active_sku_code_bases',
    // Can only view active SKU code base entries
    
    ADMIN_OVERRIDE_SKU_CODE_BASE_FILTERS: 'admin_override_sku_code_base_filters',
    // Full bypass of SKU code base filter constraints (admin-level)
  },
};

module.exports = SKU_CODE_BASE_CONSTANTS;
