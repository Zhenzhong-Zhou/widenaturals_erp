const { fetchDynamicValue } = require('../03_utils');

/**
 * Seed the `role_permissions` table with initial data.
 * Assigns relevant permissions to each role based on modern ERP access control.
 *
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  const [{ count }] = await knex('role_permissions').count('id');
  const total = Number(count) || 0;

  if (total > 0) {
    console.log(
      `[${new Date().toISOString()}] [SEED] Skipping seed for [role_permissions] table: ${total} records found.`
    );
    return;
  }

  console.log(
    `[${new Date().toISOString()}] [SEED] Inserting role-permission mappings into [role_permissions] table...`
  );

  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  if (!systemUserId) {
    throw new Error('[SEED][permissions] System user not found: system@internal.local');
  }

  const activeStatusId = await knex('status')
    .select('id')
    .where('name', 'active')
    .first()
    .then((row) => row?.id);

  if (!activeStatusId) {
    console.error('[SEED] Active status ID not found. Aborting.');
    return;
  }

  const roles = await knex('roles').select('id', 'name');
  const roleMap = Object.fromEntries(roles.map((r) => [r.name, r.id]));

  const permissions = await knex('permissions').select('id', 'key');
  const permissionMap = Object.fromEntries(
    permissions.map((p) => [p.key, p.id])
  );
  
  const salesOrderLookups = [
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
  
  // Define role-permission mapping
  const rolePermissionsData = {
    root_admin: Object.keys(permissionMap), // All permissions
    admin: [
      'manage_users',
      'view_prices',
      'manage_prices',
      'view_inventory',
      'manage_inventory',
      'view_warehouses',
      'manage_warehouses',
      'view_locations',
      'manage_locations',
      'manage_catalog',
      'manage_pricing',
      'export_pricing',
      'view_system',
      'view_system_status',
    ],
    manager: [
      'view_prices',
      'manage_prices',
      'view_inventory',
      'view_inventory_summary',
      'view_warehouses',
      'view_locations',
      'view_customer',
      'view_active_customers',
      'create_customer',
      'create_orders',
      'create_sales_order',
      ...salesOrderLookups,
    ],
    sales: [
      'view_prices',
      'view_customer',
      'create_customer',
      'create_orders',
      'create_sales_order',
      ...salesOrderLookups,
    ],
    marketing: [
      'view_prices',
      'manage_catalog',
      'view_customer',
      'create_customer',
    ],
    qa: [
      'view_inventory',
      'view_product_inventory',
      'view_material_inventory',
      'view_inventory_log',
    ],
    product_manager: [
      'view_prices',
      'manage_catalog',
      'view_inventory_summary',
      'view_batch_registry_lookup',
    ],
    account: [
      'view_prices',
      'manage_prices',
      'view_pricing_types',
      'manage_pricing',
    ],
    inventory: [
      'view_inventory',
      'manage_inventory',
      'adjust_inventory',
      'view_warehouse_inventory',
      'manage_warehouse_inventory',
      'view_locations',
      'manage_locations',
    ],
    user: [],
  };

  let insertedCount = 0;

  for (const [roleKey, permissionKeys] of Object.entries(rolePermissionsData)) {
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
