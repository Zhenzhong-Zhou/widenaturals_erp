const { fetchDynamicValue } = require('../03_utils');

/**
 * Seed role_permissions with realistic ACL groupings per role.
 *
 * Strategy:
 *  - Define reusable permission "bundles" by domain
 *  - Compose roles from bundles + role-specific extras
 *  - Dedupe per role before insert (bundles may overlap)
 */
exports.seed = async function (knex) {
  const [{ count }] = await knex('role_permissions').count('id');
  if (Number(count) > 0) {
    console.log(
      `[${new Date().toISOString()}] [SEED] role_permissions already seeded. Skipping.`
    );
    return;
  }
  
  console.log(
    `[${new Date().toISOString()}] [SEED] Seeding role_permissions...`
  );
  
  // --------------------------------------------------
  // Resolve system metadata
  // --------------------------------------------------
  
  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  if (!systemUserId) {
    throw new Error('[SEED][role_permissions] System user not found.');
  }
  
  const activeStatusId = await knex('status')
    .where({ name: 'active' })
    .first()
    .then((r) => r?.id);

  if (!activeStatusId) {
    throw new Error('[SEED][role_permissions] Active status not found.');
  }
  
  const roles = await knex('roles').select('id', 'name');
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));
  
  const permissions = await knex('permissions').select('id', 'key');
  const permissionMap = Object.fromEntries(
    permissions.map((p) => [p.key, p.id])
  );
  
  // ==================================================
  // Bundles
  // ==================================================
  
  // Every authenticated user
  const BASE_AUTH = [
    'view_self_profile',
    'edit_profile',
    'change_self_password',
    'view_user_card',
    'view_user_avatars',
  ];
  
  // Cross-domain lookups every role needs
  const COMMON_LOOKUPS = ['view_status_lookup', 'view_user_lookup'];
  
  // Sales-flow lookups
  const SALES_LOOKUPS = [
    'view_customer_lookup',
    'view_customer_address_lookup',
    'view_order_type_lookup',
    'view_payment_method_lookup',
    'view_discount_lookup',
    'view_tax_rate_lookup',
    'view_delivery_method_lookup',
    'view_sku_lookup',
    'view_pricing_group_lookup',
    'view_packaging_material_lookup',
  ];
  
  // Inventory / warehouse lookups
  const INVENTORY_LOOKUPS = [
    'view_warehouse_lookup',
    'view_warehouse_type_lookup',
    'view_location_lookup',
    'view_location_type_lookup',
    'view_batch_registry_lookup',
    'view_batch_status_lookup',
    'view_lot_adjustment_type_lookup',
    'view_inventory_status_lookup',
    'view_inventory_action_type_lookup',
    'view_manufacturer_lookup',
    'view_supplier_lookup',
    'view_packaging_material_supplier_lookup',
  ];
  
  // Product / SKU lookups
  const PRODUCT_LOOKUPS = [
    'view_product_lookup',
    'view_sku_code_base_lookup',
    'view_pricing_type_lookup',
  ];
  
  // Catalog read - shared by sales, marketing, qa, account, pm
  const CATALOG_READ = [
    'view_products',
    'view_active_products',
    'view_product_details',
    'view_skus',
    'view_sku_cards',
    'view_sku_details',
    'view_sku_images',
    'view_compliance_records',
  ];
  
  // Customer read/write
  const CUSTOMER_READ = [
    'view_customers',
    'view_active_customers',
    'view_addresses',
  ];
  
  const CUSTOMER_WRITE = ['create_customers', 'create_addresses'];
  
  // Pricing read
  const PRICING_READ = [
    'view_pricing',
    'view_pricing_details',
    'view_pricing_types',
    'view_pricing_type_details',
    'view_pricing_groups',
    'view_pricing_group_details',
    'view_pricing_group_skus',
    'view_all_valid_pricing',
  ];
  
  // Sales order read
  const SALES_ORDER_READ = [
    'view_orders',
    'view_order_types',
    'view_sales_order',
    'view_sales_order_metadata',
    'view_order_item_metadata',
    'view_all_valid_discounts',
    'view_all_valid_tax_rates',
  ];
  
  // Sales order write
  const SALES_ORDER_WRITE = [
    'create_orders',
    'create_sales_order',
    'update_sales_order',
    'confirm_awaiting_review_sales_order',
    'confirm_sales_order',
    'cancel_sales_order',
  ];
  
  // Order pipeline stage visibility
  const ORDER_STAGES = [
    'view_allocation_stage',
    'view_fulfillment_stage',
    'view_shipping_stage',
  ];
  
  // Inventory read
  const INVENTORY_READ = [
    'view_warehouses',
    'view_warehouse_details',
    'view_locations',
    'view_location_types',
    'view_warehouse_inventory',
    'view_warehouse_inventory_details',
    'view_warehouse_inventory_summary',
    'view_warehouse_inventory_summary_item_details',
    'view_warehouse_inventory_activity_log',
  ];
  
  // Inventory write
  const INVENTORY_WRITE = [
    'create_warehouse_inbound',
    'create_warehouse_outbound',
    'adjust_warehouse_inventory',
    'update_warehouse_inventory_status',
    'update_warehouse_inventory_metadata',
  ];
  
  // ==================================================
  // ACL-layer bundles (business-layer scope filters)
  // ==================================================
  
  // Warehouse inventory ACL — controls scope/field visibility
  // AFTER the route-level view_warehouse_inventory gate passes
  const WAREHOUSE_INV_ACL_READ_BASE = [
    'view_warehouse_product_inventory',
    'view_warehouse_packaging_inventory',
    'view_warehouse_inventory_manufacturer',
    'view_warehouse_inventory_supplier',
  ];
  
  const WAREHOUSE_INV_ACL_FULL_SCOPE = [
    'view_all_warehouses',
    'view_all_warehouse_batch_types',
  ];
  
  const WAREHOUSE_INV_ACL_FINANCIALS = [
    'view_warehouse_inventory_financials',
  ];
  
  const WAREHOUSE_INV_ACL_WRITE = [
    'reserve_warehouse_inventory',
    'release_warehouse_reservation',
    'transfer_warehouse_inventory',
    'force_adjust_reserved',
  ];
  
  // Warehouse-level ACL bundles

  // Lets the UI show stock totals on warehouse cards/lists
  const WAREHOUSE_SUMMARY_VIEW = ['view_warehouse_summary'];

  // Admin-level warehouse visibility/mutation overrides
  const WAREHOUSE_ADMIN = [
    'view_archived_warehouses',
    'view_all_warehouse_statuses',
    'archive_warehouse',
    'view_all_warehouse_types',
  ];
  
  // ────────────────────────────────────────────────────────────────────
  // New ACL bundles (add to your existing bundles section)
  // ────────────────────────────────────────────────────────────────────
  
  // Manufacturer ACL
  const MANUFACTURER_MUTATION = [
    'create_manufacturers',
    'update_manufacturers',
    'manage_manufacturers',
  ];
  
  const MANUFACTURER_ADMIN = [
    'archive_manufacturers',
    'restore_manufacturers',
    'delete_manufacturers',
    'view_archived_manufacturers',
    'view_inactive_manufacturers',
    'view_all_manufacturers_visibility',
    'admin_override_manufacturer_filters',
  ];
  
  const MANUFACTURER_READ = [
    'view_manufacturer_locations',
    'search_manufacturers_by_status',
    'search_manufacturers_by_location',
  ];

  // Supplier ACL (mirrors manufacturer)
  const SUPPLIER_MUTATION = [
    'create_suppliers',
    'update_suppliers',
    'manage_suppliers',
  ];
  
  const SUPPLIER_ADMIN = [
    'archive_suppliers',
    'restore_suppliers',
    'delete_suppliers',
    'view_archived_suppliers',
    'view_inactive_suppliers',
    'view_all_suppliers_visibility',
    'admin_override_supplier_filters',
  ];
  
  const SUPPLIER_READ = [
    'view_supplier_locations',
    'search_suppliers_by_status',
    'search_suppliers_by_location',
  ];

  // Packaging material supplier ACL
  const PACKAGING_SUPPLIER_ADMIN = [
    'view_all_packaging_material_suppliers',
    'view_archived_packaging_material_suppliers',
    'admin_override_packaging_material_supplier_filters',
  ];

  // Location ACL
  const LOCATION_ACL = [
    'view_all_locations',
    'view_archived_locations',
    'view_all_location_statuses',
    'view_all_location_types',
    'archive_location',
  ];

  // Location type CRUD (config-level, admin)
  const LOCATION_TYPE_ADMIN = [
    'create_location_types',
    'update_location_types',
    'delete_location_types',
    'view_inactive_location_types',
    'view_all_location_types_visibility',
    'search_location_types_by_status',
    'manage_location_types',
    'admin_override_location_type_filters',
  ];

  // Inventory allocation/status/action-type overrides
  const INVENTORY_ACL_ADMIN = [
    'view_all_inventory_allocations',
    'reassign_inventory_allocation',
    'view_all_inventory_action_type_statuses',
    'view_all_inventory_status',
  ];

  // Lot adjustment type ACL
  const LOT_ADJUSTMENT_ACL = [
    'view_all_lot_adjustment_type_statuses',
    'view_internal_lot_adjustment_types',
  ];

  // Order type ACL
  const ORDER_TYPE_ACL = [
    'view_order_type_code',
    'view_all_order_type_statuses',
  ];

  // Generic order permissions (bypass category gates — admin-only)
  const GENERIC_ORDER_ADMIN = [
    'view_order',
    'create_order',
    'update_order',
    'delete_order',
  ];
  
  // Batch read
  const BATCH_READ = [
    'view_batch_registry',
    'view_batch_detailed_details',
    'view_product_batches',
    'view_packaging_batches',
    'view_packaging_material_batches',
    'view_product_batch_details',
    'view_packaging_material_batch_details',
    'view_batch_statuses',
    'view_batch_manufacturer',
    'view_batch_supplier',
  ];
  
  // Batch QA actions
  const BATCH_QA = [
    'update_batch_status',
    'change_product_batch_status',
    'change_packaging_batch_status',
    'edit_product_batch_release_metadata',
    'release_product_batch',
    'release_packaging_material_batch',
    'search_batch_by_lot',
    'search_batch_by_product',
    'search_batch_by_material',
    'search_product_batch_by_sku',
    'search_product_batch_by_manufacturer',
    'search_batch_by_supplier',
    'view_inactive_batch_statuses',
    'view_all_batch_statuses',
    'view_compliance_record_metadata',
    'view_compliance_record_history',
    'view_compliance_record_inactive',
  ];
  
  // Batch production / creation
  const BATCH_WRITE = [
    'create_product_batches',
    'create_packaging_batches',
    'create_packaging_material_batches',
    'edit_product_batch_metadata_basic',
    'edit_packaging_batch_metadata_basic',
    'edit_product_material_batches',
    'edit_packaging_material_batches',
    'update_product_batch_status',
    'update_packaging_material_batch_status',
    'receive_product_batch',
    'receive_packaging_material_batch',
    'archive_batches',
    'update_batch_registry_note',
  ];
  
  // Allocation / fulfillment workflow
  const FULFILLMENT_OPS = [
    'allocate_inventory',
    'review_allocation',
    'view_inventory_allocations',
    'confirm_allocation',
    'initiate_outbound_fulfillment',
    'confirm_outbound_fulfillment',
    'view_outbound_fulfillments',
    'view_outbound_fulfillment_details',
    'complete_manual_outbound_fulfillments',
    'ship_sales_order',
    'complete_sales_order',
  ];
  
  // BOM read
  const BOM_READ = [
    'view_boms',
    'view_bom_details',
    'view_bom_production_summary',
  ];
  
  // Non-sales order types - read only
  const SECONDARY_ORDER_TYPES_READ = [
    'view_purchase_order',
    'view_transfer_order',
    'view_return_order',
    'view_adjustment_order',
    'view_logistics_order',
    'view_manufacturing_order',
  ];
  
  // Admin overrides
  const ADMIN_OVERRIDES = [
    'admin_override_user_filters',
    'admin_override_role_visibility',
    'admin_override_product_filters',
    'admin_override_sku_filters',
    'admin_override_sku_code_base_filters',
    'admin_override_status_filters',
    'admin_override_customer_filters',
    'admin_override_batch_filters',
  ];
  
  // Admin user management
  const USER_MGMT = [
    'create_users',
    'create_admin_users',
    'create_user',
    'view_users',
    'view_user_list',
    'view_inactive_users',
    'view_all_users_visibility',
    'view_any_user_profile',
    'view_user_roles',
    'search_users_by_role',
    'search_users_by_status',
    'reset_any_user_password',
    'force_reset_any_user_password',
    'manage_users',
    'reset_user_credentials',
    'assign_user_roles',
  ];
  
  // Admin role management
  const ROLE_MGMT = [
    'view_roles',
    'view_all_roles',
    'view_inactive_roles',
    'view_role_hierarchy',
    'view_role_metadata',
    'view_role_lookup',
    'manage_roles',
    'assign_role_permissions',
  ];
  
  // ==================================================
  // Role definitions
  // ==================================================
  
  const ROLE_DEFINITIONS = {
    root_admin: ['root_access'],
    
    admin: [
      ...BASE_AUTH,
      ...COMMON_LOOKUPS,
      ...USER_MGMT,
      ...ROLE_MGMT,
      ...ADMIN_OVERRIDES,
      ...CATALOG_READ,
      ...CUSTOMER_READ,
      ...PRICING_READ,
      ...SALES_ORDER_READ,
      ...ORDER_STAGES,
      ...INVENTORY_READ,
      ...BATCH_READ,
      ...SECONDARY_ORDER_TYPES_READ,
      ...WAREHOUSE_INV_ACL_READ_BASE,
      ...WAREHOUSE_INV_ACL_FULL_SCOPE,
      ...WAREHOUSE_INV_ACL_FINANCIALS,
      ...WAREHOUSE_INV_ACL_WRITE,
      ...MANUFACTURER_MUTATION,
      ...MANUFACTURER_ADMIN,
      ...MANUFACTURER_READ,
      ...SUPPLIER_MUTATION,
      ...SUPPLIER_ADMIN,
      ...SUPPLIER_READ,
      ...PACKAGING_SUPPLIER_ADMIN,
      'view_active_packaging_material_suppliers',
      ...LOCATION_ACL,
      ...LOCATION_TYPE_ADMIN,
      ...INVENTORY_ACL_ADMIN,
      ...LOT_ADJUSTMENT_ACL,
      ...ORDER_TYPE_ACL,
      ...GENERIC_ORDER_ADMIN,
      ...WAREHOUSE_SUMMARY_VIEW,
      ...WAREHOUSE_ADMIN,
      'view_all_orders',
      'view_all_statuses',
      'view_all_products',
      'view_all_customers',
      'view_inactive_product',
      'view_inactive_sku',
      'view_inactive_pricing',
      'override_locked_order_status',
      'export_pricing',
      'view_pricing_history',
      'view_all_pricing_states',
    ],
    
    manager: [
      ...BASE_AUTH,
      ...COMMON_LOOKUPS,
      ...SALES_LOOKUPS,
      ...INVENTORY_LOOKUPS,
      ...PRODUCT_LOOKUPS,
      ...CATALOG_READ,
      ...CUSTOMER_READ,
      ...CUSTOMER_WRITE,
      ...PRICING_READ,
      ...SALES_ORDER_READ,
      ...SALES_ORDER_WRITE,
      ...ORDER_STAGES,
      ...INVENTORY_READ,
      ...BATCH_READ,
      ...SECONDARY_ORDER_TYPES_READ,
      ...WAREHOUSE_INV_ACL_READ_BASE,
      ...WAREHOUSE_INV_ACL_FULL_SCOPE,
      ...WAREHOUSE_INV_ACL_FINANCIALS,
      ...MANUFACTURER_READ,
      ...SUPPLIER_READ,
      ...WAREHOUSE_SUMMARY_VIEW,
      'view_active_packaging_material_suppliers',
      'view_all_locations',
      'view_all_inventory_allocations',
      'reassign_inventory_allocation',
      'reserve_warehouse_inventory',
      'release_warehouse_reservation',
      'transfer_warehouse_inventory',
      'force_adjust_reserved',
    ],
    
    sales: [
      ...BASE_AUTH,
      ...COMMON_LOOKUPS,
      ...SALES_LOOKUPS,
      ...CATALOG_READ,
      ...CUSTOMER_READ,
      ...CUSTOMER_WRITE,
      ...PRICING_READ,
      ...SALES_ORDER_READ,
      ...SALES_ORDER_WRITE,
      ...ORDER_STAGES,
      'view_inventory_allocations',
      'view_outbound_fulfillments',
      'view_outbound_fulfillment_details',
      'view_warehouse_product_inventory',
      'reserve_warehouse_inventory',
      'release_warehouse_reservation',
    ],
    
    marketing: [
      ...BASE_AUTH,
      ...COMMON_LOOKUPS,
      ...PRODUCT_LOOKUPS,
      ...CATALOG_READ,
      ...CUSTOMER_READ,
      ...CUSTOMER_WRITE,
      'view_sku_image_metadata',
      'view_sku_image_history',
      'view_pricing_groups',
      'view_pricing_group_details',
      'view_pricing_group_skus',
      'view_all_valid_discounts',
    ],
    
    qa: [
      ...BASE_AUTH,
      ...COMMON_LOOKUPS,
      ...PRODUCT_LOOKUPS,
      ...INVENTORY_LOOKUPS,
      ...CATALOG_READ,
      ...BATCH_READ,
      ...BATCH_QA,
      ...INVENTORY_READ,
      ...WAREHOUSE_INV_ACL_READ_BASE,
      'view_all_warehouse_batch_types',
      'view_all_packaging_statuses',
      'view_archived_packaging_materials',
      'view_manufacturer_locations',
      'view_supplier_locations',
      'view_active_packaging_material_suppliers',
      'view_all_packaging_material_suppliers',
    ],
    
    product_manager: [
      ...BASE_AUTH,
      ...COMMON_LOOKUPS,
      ...PRODUCT_LOOKUPS,
      ...CATALOG_READ,
      ...BOM_READ,
      'view_all_products',
      'view_inactive_product',
      'view_inactive_sku',
      'view_all_statuses_skus',
      'view_sku_image_metadata',
      'view_sku_image_history',
      'create_products',
      'update_product_info',
      'update_product_status',
      'create_skus',
      'create_skus_images',
      'update_sku_metadata',
      'update_sku_info',
      'update_sku_status',
      'update_sku_dimension',
      'update_sku_identity',
      'update_sku_images',
      'view_pricing_groups',
      'view_pricing_group_skus',
      'view_batch_registry',
      'view_warehouse_inventory_summary',
      'view_warehouse_product_inventory',
      'view_warehouse_packaging_inventory',
      'view_all_warehouse_batch_types',
      'view_warehouse_inventory_manufacturer',
      'view_manufacturer_locations',
    ],
    
    account: [
      ...BASE_AUTH,
      ...COMMON_LOOKUPS,
      ...SALES_LOOKUPS,
      ...PRODUCT_LOOKUPS,
      ...CATALOG_READ,
      ...CUSTOMER_READ,
      ...PRICING_READ,
      ...SALES_ORDER_READ,
      ...WAREHOUSE_INV_ACL_READ_BASE,
      ...WAREHOUSE_INV_ACL_FULL_SCOPE,
      ...WAREHOUSE_INV_ACL_FINANCIALS,
      ...WAREHOUSE_SUMMARY_VIEW,
      'manage_pricing_types',
      'manage_pricing_groups',
      'assign_pricing_skus',
      'view_inactive_pricing',
      'view_pricing_history',
      'view_all_pricing_states',
      'export_pricing',
      'view_all_payment_method_statuses',
      'view_payment_code',
      'view_all_discount_statuses',
      'view_all_tax_rate_states',
      'view_supplier_locations',
      'view_active_packaging_material_suppliers',
    ],
    
    manufacturing_director: [
      ...BASE_AUTH,
      ...COMMON_LOOKUPS,
      ...PRODUCT_LOOKUPS,
      ...INVENTORY_LOOKUPS,
      ...CATALOG_READ,
      ...BOM_READ,
      ...BATCH_READ,
      ...BATCH_WRITE,
      ...INVENTORY_READ,
      ...WAREHOUSE_INV_ACL_READ_BASE,
      ...WAREHOUSE_INV_ACL_FULL_SCOPE,
      ...WAREHOUSE_INV_ACL_FINANCIALS,
      ...MANUFACTURER_MUTATION,
      ...MANUFACTURER_READ,
      ...SUPPLIER_MUTATION,
      ...SUPPLIER_READ,
      ...WAREHOUSE_SUMMARY_VIEW,
      'view_all_packaging_material_suppliers',
      'view_active_packaging_material_suppliers',
      'view_all_locations',
      'view_all_inventory_allocations',
      'reassign_inventory_allocation',
      'reserve_warehouse_inventory',
      'release_warehouse_reservation',
      'transfer_warehouse_inventory',
      'view_manufacturing_order',
      'create_manufacturing_order',
      'update_manufacturing_order',
      'delete_manufacturing_order',
      'view_purchase_order',
      'create_purchase_order',
      'update_purchase_order',
      'view_transfer_order',
      'create_transfer_order',
      'update_transfer_order',
      'view_adjustment_order',
      'create_adjustment_order',
      'update_adjustment_order',
      'view_logistics_order',
      'view_all_products',
      'view_inactive_product',
      'view_compliance_record_metadata',
      'view_compliance_record_history',
    ],
    
    inventory: [
      ...BASE_AUTH,
      ...COMMON_LOOKUPS,
      ...INVENTORY_LOOKUPS,
      ...PRODUCT_LOOKUPS,
      ...SALES_LOOKUPS,
      ...CATALOG_READ,
      ...INVENTORY_READ,
      ...INVENTORY_WRITE,
      ...BATCH_READ,
      ...FULFILLMENT_OPS,
      ...ORDER_STAGES,
      ...WAREHOUSE_INV_ACL_READ_BASE,
      ...WAREHOUSE_SUMMARY_VIEW,
      'view_all_warehouse_batch_types',
      'reserve_warehouse_inventory',
      'release_warehouse_reservation',
      'transfer_warehouse_inventory',
      'view_orders',
      'view_sales_order',
      'cancel_sales_order',
      'receive_product_batch',
      'receive_packaging_material_batch',
      'view_transfer_order',
      'create_transfer_order',
      'update_transfer_order',
      'view_adjustment_order',
      'create_adjustment_order',
      'update_adjustment_order',
      'view_return_order',
      'create_return_order',
      'update_return_order',
      'view_purchase_order',
      'view_logistics_order',
      'view_all_packaging_statuses',
      'view_manufacturer_locations',
      'view_supplier_locations',
      'view_active_packaging_material_suppliers',
      'view_all_locations',
      'view_internal_lot_adjustment_types',
      'view_all_inventory_allocations',
    ],
    
    user: [...BASE_AUTH],
  };
  
  // --------------------------------------------------
  // Insert mappings
  // --------------------------------------------------
  
  let insertedCount = 0;
  const missingPermissions = new Set();
  
  for (const [roleKey, permissionKeys] of Object.entries(ROLE_DEFINITIONS)) {
    const roleId = roleMap[roleKey];
    if (!roleId) {
      console.warn(`[SEED] Role '${roleKey}' not found. Skipping.`);
      continue;
    }
    
    // Dedupe (bundles may overlap)
    const uniqueKeys = [...new Set(permissionKeys)];
    
    for (const permissionKey of uniqueKeys) {
      const permissionId = permissionMap[permissionKey];
      if (!permissionId) {
        missingPermissions.add(permissionKey);
        continue;
      }
      
      await knex('role_permissions')
        .insert({
          id: knex.raw('uuid_generate_v4()'),
          role_id: roleId,
          permission_id: permissionId,
          status_id: activeStatusId,
          created_at: knex.fn.now(),
          created_by: systemUserId,
          updated_at: null,
          updated_by: null,
        })
        .onConflict(['role_id', 'permission_id'])
        .ignore();
      
      insertedCount++;
    }
  }
  
  if (missingPermissions.size > 0) {
    console.warn(
      `[SEED] ${missingPermissions.size} permission key(s) not found in DB: ${[...missingPermissions].join(', ')}`
    );
  }
  
  console.log(`[SEED] Inserted ${insertedCount} role-permission mappings.`);
};
