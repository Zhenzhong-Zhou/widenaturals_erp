const PERMISSION_KEYS = {
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
    VIEW_DETAILS: 'view_product_details',
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
    UPDATE_METADATA: 'update_sku_metadata',
    UPDATE_STATUS: 'update_sku_status',
    UPDATE_DIMENSIONS: 'update_sku_dimension',
    UPDATE_IDENTITY: 'update_sku_identity',
    UPDATE_INFO: 'update_sku_info',
    UPDATE_IMAGE: 'update_sku_images',
  },
  PRICING_TYPES: {
    VIEW: 'view_pricing_types',
    VIEW_PRICING_TYPES_DETAILS: 'view_pricing_type_details',
  },
  PRICING_GROUPS: {
    VIEW: 'view_pricing_groups',
    VIEW_DETAILS: 'view_pricing_group_details',
    VIEW_SKUS: 'view_pricing_group_skus',
  },
  PRICING: {
    VIEW: 'view_pricing',
    EXPORT_DATA: 'export_pricing',
    VIEW_DETAILS: 'view_pricing_details',
  },
  COMPLIANCE_RECORDS: {
    VIEW_LIST: 'view_compliance_records',
  },
  BOMS: {
    VIEW_LIST: 'view_boms',
    VIEW_BOM_DETAILS: 'view_bom_details',
    VIEW_BOM_PRODUCTION_SUMMARY: 'view_bom_production_summary',
  },
  LOCATION_TYPES: {
    VIEW: 'view_location_types',
    VIEW_DETAILS: 'view_location_type_details',
  },
  LOCATIONS: {
    VIEW: 'view_locations',
  },
  BATCH_REGISTRY: {
    VIEW_LIST: 'view_batch_registry',
    UPDATE_NOTE: 'update_batch_registry_note',
    VIEW_DETAILS: 'view_batch_detailed_details',
  },
  PRODUCT_BATCHES: {
    VIEW_LIST: 'view_product_batches',
    CREATE: 'create_product_batches',
    EDIT: 'edit_product_material_batches',
    UPDATE_STATUS: 'update_product_batch_status',
    RECEIVE: 'receive_product_batch',
    RELEASE: 'release_product_batch',
    VIEW_DETAILS: 'view_product_batch_details',
  },
  PACKAGING_MATERIAL_BATCHES: {
    VIEW_LIST: 'view_packaging_material_batches',
    CREATE: 'create_packaging_material_batches',
    EDIT: 'edit_packaging_material_batches',
    UPDATE_STATUS: 'update_packaging_material_batch_status',
    RECEIVE: 'receive_packaging_material_batch',
    RELEASE: 'release_packaging_material_batch',
    VIEW_DETAILS: 'view_packaging_material_batch_details',
  },
  WAREHOUSE_INVENTORY: {
    READ:                    'read_warehouse_inventory',
    CREATE_INBOUND:          'create_warehouse_inbound',
    CREATE_OUTBOUND:         'create_warehouse_outbound',
    ADJUST_INVENTORY:        'adjust_warehouse_inventory',
    UPDATE_INVENTORY_STATUS: 'update_warehouse_inventory_status',
    VIEW_SUMMARY:            'view_warehouse_inventory_summary',
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

module.exports = PERMISSION_KEYS;
