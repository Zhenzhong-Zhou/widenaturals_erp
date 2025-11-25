const PRODUCT_CONSTANTS = {
  PERMISSIONS: {
    VIEW_ALL_PRODUCTS: 'view_all_products',
    // Can view all product entries regardless of status
    
    VIEW_ACTIVE_PRODUCTS: 'view_active_products',
    // Can only view active product entries
    
    ADMIN_OVERRIDE_PRODUCT_FILTERS: 'admin_override_product_filters',
    // Full bypass of product filter constraints (admin-level)
  },
};

module.exports = PRODUCT_CONSTANTS;
