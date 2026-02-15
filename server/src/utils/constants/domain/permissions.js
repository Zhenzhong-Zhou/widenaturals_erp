const PERMISSIONS = {
  USERS: {
    CREATE_USER: 'create_user',
    VIEW_USERS: 'view_users',
    VIEW_LIST: 'view_user_list',
    VIEW_CARD: 'view_user_card',
    VIEW_SELF_PROFILE: 'view_self_profile',
    VIEW_ANY_USER_PROFILE: 'view_any_user_profile',
    EDIT: 'edit_profile',
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
  PRICING_TYPES: {
    VIEW: 'view_pricing_types',
    VIEW_PRICING_TYPES_DETAILS: 'view_pricing_type_details',
  },
  PRICING: {
    VIEW: 'view_prices',
    EXPORT_DATA: 'export_prices',
    VIEW_DETAILS: 'view_price_details',
  },
  COMPLIANCE_RECORDS: {
    VIEW_LIST: 'view_compliance_records',
  },
  BOMS: {
    VIEW_LIST: 'view_boms',
    VIEW_BOM_DETAILS: 'view_bom_details',
    VIEW_BOM_PRODUCTION_SUMMARY: 'view_bom_production_summary',
  },
  LOCATIONS_TYPES: {
    VIEW: 'view_location_types',
    VIEW_DETAILS: 'view_location_type_details',
  },
  LOCATIONS: {
    VIEW: 'view_locations',
  },
  BATCH_REGISTRY: {
    VIEW_LIST: 'view_batch_registry',
  },
  PRODUCT_BATCH: {
    VIEW_LIST: 'view_product_batches',
  },
  PACKAGING_BATCH: {
    VIEW_LIST: 'view_packaging_material_batches',
  },
  WAREHOUSE_INVENTORY: {
    CREATE: 'create_warehouse_inventory',
    VIEW: 'view_warehouse_inventory',
    ADJUST: 'adjust_warehouse_inventory',
    VIEW_SUMMARY: 'view_warehouse_inventory_summary',
    VIEW_SUMMARY_ITEM_DETAILS: 'view_warehouse_inventory_summary_item_details',
  },
  REPORTS: {
    VIEW_INVENTORY_LOGS: 'view_inventory_logs',
  },
  CUSTOMERS: {
    CREATE: 'create_customers',
    VIEW: 'view_customers',
  },
  ADDRESSES: {
    CREATE: 'create_addresses',
    VIEW: 'view_addresses',
  },
  ORDER_TYPES: {
    VIEW: 'view_order_types',
  },
  ORDERS: {
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
  OUTBOUND_FULFILLMENTS: {
    INITIATE: 'initiate_outbound_fulfillment',
    CONFIRM: 'confirm_outbound_fulfillment',
    VIEW: 'view_outbound_fulfillments',
    COMPLETE_MANUAL: 'complete_manual_outbound_fulfillments',
  },
};

module.exports = PERMISSIONS;
