const PERMISSIONS = {
  ADMIN: {
    MANAGE: 'manage_admin',
    CREATE: 'create_admin',
    DELETE: 'delete_admin',
    VIEW: 'view_admin',
  },
  USERS: {
    CREATE_USER: 'create_user',
    VIEW_USERS: 'view_users',
    VIEW_LIST: 'view_user_list',
    VIEW_CARD: 'view_user_card',
    VIEW_SELF_PROFILE: 'view_self_profile',
    VIEW_ANY_USER_PROFILE: 'view_any_user_profile',
    MANAGE: 'manage_users',
    DELETE: 'delete_user',
    EDIT: 'edit_profile',
  },
  DASHBOARD: {
    VIEW: 'view_dashboard',
  },
  PRODUCTS: {
    VIEW: 'view_products',
    CREATE: 'create_products',
    UPDATE_STATUS: 'update_product_status',
    UPDATE_INFO: 'update_product_info',
  },
  SKUS: {
    VIEW_CARDS: 'view_sku_cards',
    VIEW_DETAILS: 'view_sku_details',
    VIEW_LIST: 'view_skus',
    CREATE: 'create_skus',
    UPLOAD_IMAGE: 'create_skus_images',
    UPDATE_STATUS: 'update_sku_status',
    UPDATE_INFO: 'update_sku_info',
    UPDATE_IMAGE: 'update_sku_images',
  },
  COMPLIANCE_RECORDS: {
    VIEW_LIST: 'view_compliance_records',
  },
  BOMS: {
    VIEW_LIST: 'view_boms',
    VIEW_BOM_DETAILS: 'view_bom_details',
    VIEW_BOM_PRODUCTION_SUMMARY: 'view_bom_production_summary',
  },
  BATCH_REGISTRY: {
    VIEW_LIST: 'view_batch_registry',
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
