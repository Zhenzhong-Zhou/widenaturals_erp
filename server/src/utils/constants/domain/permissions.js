const PERMISSIONS = {
  ADMIN: {
    MANAGE: 'manage_admin',
    CREATE: 'create_admin',
    DELETE: 'delete_admin',
    VIEW: 'view_admin',
  },
  USERS: {
    MANAGE: 'manage_users',
    DELETE: 'delete_user',
    EDIT: 'edit_profile',
  },
  DASHBOARD: {
    VIEW: 'view_dashboard',
  },
  PRODUCTS: {
    VIEW: 'view_products',
    UPDATE_STATUS: 'update_product_status',
    UPDATE_INFO: 'update_product_INFO',
  },
  SKUS: {
    VIEW_CARDS: 'view_sku_cards',
    VIEW_DETAILS: 'view_sku_details',
  },
  BOMS: {
    VIEW_LIST: 'view_boms',
    VIEW_BOM_DETAILS: 'view_bom_details',
    VIEW_BOM_PRODUCTION_SUMMARY: 'view_bom_production_summary',
  },
  REPORTS: {
    VIEW: 'view_reports',
  },
  ORDER: {
    CREATE: 'create_orders',
    VIEW: 'view_orders',
    UPDATE_STATUS: 'update_order_status',
  },
  INVENTORY_ALLOCATION: {
    ALLOCATE: 'allocate_inventory',
    REVIEW: 'review_allocation',
    VIEW: 'view_inventory_allocations',
    CONFIRM: 'confirm_allocation',
  },
  OUTBOUND_FULFILLMENT: {
    INITIATE: 'initiate_outbound_fulfillment',
    CONFIRM: 'confirm_outbound_fulfillment',
    VIEW: 'view_outbound_fulfillments',
    COMPLETE_MANUAL: 'complete_manual_outbound_fulfillments',
  },
};

module.exports = PERMISSIONS;
