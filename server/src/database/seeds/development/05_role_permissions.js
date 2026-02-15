const { fetchDynamicValue } = require('../03_utils');

/**
 * Seed role_permissions with structured ACL hierarchy.
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

  // --------------------------------------------------
  // Base permissions (ALL authenticated users)
  // --------------------------------------------------

  const BASE_AUTH_PERMISSIONS = [
    'view_self_profile',
    'change_self_password',
    'view_user_card',
    'view_dashboard',
    'view_sku_cards',
    'view_sku_details',
    'view_compliance_records',
  ];

  // --------------------------------------------------
  // Shared helper groups
  // --------------------------------------------------
  const ORDERS = ['view_orders'];

  const SALES_LOOKUPS = [
    'view_customer_lookup',
    'view_customer_address_lookup',
    'view_order_type_lookup',
    'view_payment_method_lookup',
    'view_discount_lookup',
    'view_tax_rate_lookup',
    'view_delivery_method_lookup',
    'view_sku_lookup',
    'view_pricing_lookup',
    'view_packaging_material_lookup',
  ];

  const SALES_CORE = [
    ...ORDERS,
    'view_sales_order',
    'create_sales_order',
    ...SALES_LOOKUPS,
  ];

  // --------------------------------------------------
  // Role definitions (composed from base)
  // --------------------------------------------------

  const ROLE_DEFINITIONS = {
    root_admin: ['root_access'],

    admin: [
      ...BASE_AUTH_PERMISSIONS,
      'export_prices',
      'view_system',
      'view_system_status',
    ],

    manager: [
      ...BASE_AUTH_PERMISSIONS,
      'view_inventory',
      'view_inventory_summary',
      'view_warehouses',
      'view_locations',
      'view_active_customers',
      'create_customer',
      'view_allocation_stage',
      ...SALES_CORE,
    ],

    sales: [
      ...BASE_AUTH_PERMISSIONS,
      'view_customers',
      'create_customers',
      ...SALES_CORE,
    ],

    marketing: [...BASE_AUTH_PERMISSIONS, 'view_customers', 'create_customers'],

    qa: [
      ...BASE_AUTH_PERMISSIONS,
      'view_batch_registry',
      'view_product_batches',
      'view_packaging_material_batches',
      'view_warehouse_inventory',
      'view_inventory_logs',
    ],

    product_manager: [
      ...BASE_AUTH_PERMISSIONS,
      'view_inventory_summary',
      'view_batch_registry_lookup',
    ],

    account: [...BASE_AUTH_PERMISSIONS, 'view_pricing_types'],

    inventory: [
      ...BASE_AUTH_PERMISSIONS,
      'view_warehouse_inventory',
      'adjust_warehouse_inventory',
      'view_locations',
      'view_allocation_stage',
      'view_fulfillment_stage',
      'view_shipping_stage',
      ...SALES_CORE,
    ],

    user: [...BASE_AUTH_PERMISSIONS],
  };

  // --------------------------------------------------
  // Insert mappings
  // --------------------------------------------------

  let insertedCount = 0;

  for (const [roleKey, permissionKeys] of Object.entries(ROLE_DEFINITIONS)) {
    const roleId = roleMap[roleKey];
    if (!roleId) {
      console.warn(`[SEED] Role '${roleKey}' not found. Skipping.`);
      continue;
    }

    for (const permissionKey of permissionKeys) {
      const permissionId = permissionMap[permissionKey];
      if (!permissionId) {
        console.warn(
          `[SEED] Permission '${permissionKey}' not found. Skipping.`
        );
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

  console.log(`[SEED] Inserted ${insertedCount} role-permission mappings.`);
};
