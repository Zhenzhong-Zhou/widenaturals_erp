const SKU_CONSTANTS = {
  PERMISSIONS: {
    ALLOW_BACKORDER_SKUS: 'allow_backorder_skus',               // Allow SKUs with no stock
    ALLOW_INTERNAL_ORDER_SKUS: 'allow_internal_order_skus',     // Allow inactive/discontinued SKUs for internal orders
    ADMIN_OVERRIDE_SKU_FILTERS: 'admin_override_sku_filters',   // Full bypass of SKU filter constraints
  },
};

module.exports = SKU_CONSTANTS;
