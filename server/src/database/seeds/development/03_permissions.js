const { fetchDynamicValue } = require('../03_utils');
exports.seed = async function (knex) {
  const [{ count }] = await knex('permissions').count('id');

  if (parseInt(count, 10) > 0) {
    console.log('Skipping permissions seed: data already exists.');
    return;
  }

  console.log(`[${new Date().toISOString()}] [SEED] Starting permission seeding...`);
  
  // Fetch the active status ID dynamically
  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  const activeStatusId = await knex('status')
    .select('id')
    .where('name', 'active')
    .first()
    .then((row) => row.id);
  
  const baseFields = {
    status_id: activeStatusId,
    created_at: knex.fn.now(),
    created_by: systemUserId,
    updated_at: null,
    updated_by: null,
  };
  
  const permissions = [
    { name: 'Manage Users', key: 'manage_users', description: 'Allows managing user accounts' },
    { name: 'View Prices', key: 'view_prices', description: 'Allows viewing price details' },
    { name: 'Manage Prices', key: 'manage_prices', description: 'Allows updating price details' },
    { name: 'View Locations', key: 'view_locations', description: 'Allows viewing location details' },
    { name: 'Manage Locations', key: 'manage_locations', description: 'Allows updating location details' },
    { name: 'View Warehouses', key: 'view_warehouses', description: 'Allows viewing warehouse details' },
    { name: 'Manage Warehouses', key: 'manage_warehouses', description: 'Allows updating warehouse details' },
    { name: 'Root Access', key: 'root_access', description: 'Grants access to all routes and operations' },
    
    // Audit and Logs
    { name: 'View Address Audit', key: 'view_address_audit', description: 'Allows viewing address-related audit logs' },
    
    // Address & Customer
    { name: 'View Address Detail', key: 'view_address_detail', description: 'Allows viewing detailed address information' },
    { name: 'View Customer', key: 'view_customer', description: 'Allows viewing customer details' },
    { name: 'Create Customer', key: 'create_customer', description: 'Allows creating new customers' },
    { name: 'Create Address', key: 'create_address', description: 'Allows creating address records' },
    
    // Orders
    { name: 'Create Orders', key: 'create_orders', description: 'Allows creating orders (generic permission)' },
    
    // Lookup Permissions (new/missing adjusted)
    { name: 'View Batch Registry Lookup', key: 'view_batch_registry_lookup', description: 'Allows accessing batch registry dropdown' },
    { name: 'View Warehouse Lookup', key: 'view_warehouse_lookup', description: 'Allows accessing warehouse lookup dropdown' },
    { name: 'View Lot Adjustment Type Lookup', key: 'view_lot_adjustment_type_lookup', description: 'Allows accessing lot adjustment type dropdown' },
    { name: 'View Customer Lookup', key: 'view_customer_lookup', description: 'Allows accessing customer lookup' },
    { name: 'View Customer Address Lookup', key: 'view_customer_address_lookup', description: 'Allows accessing customer address lookup' },
    { name: 'View Order Type Lookup', key: 'view_order_type_lookup', description: 'Allows viewing order type dropdown' },
    { name: 'View Payment Method Lookup', key: 'view_payment_method_lookup', description: 'Allows viewing payment method dropdown' },
    
    // Pricing
    { name: 'View Pricing Types', key: 'view_pricing_types', description: 'Allows viewing pricing type data' },
    { name: 'View All Pricing Types', key: 'view_all_pricing_types', description: 'Allows viewing all available pricing types' },
    { name: 'View Pricing Config', key: 'view_pricing_config', description: 'Allows viewing pricing configuration settings' },
    { name: 'Manage Pricing', key: 'manage_pricing', description: 'Allows managing pricing configuration and rules' },
    { name: 'Export Pricing', key: 'export_pricing', description: 'Allows exporting pricing data' },
    
    // Catalog
    { name: 'Manage Catalog', key: 'manage_catalog', description: 'Allows managing catalog items and details' },
    
    // Inventory & System
    { name: 'View Inventory', key: 'view_inventory', description: 'Allows viewing inventory details' },
    { name: 'View Product Inventory', key: 'view_product_inventory', description: 'Allows viewing product-level inventory' },
    { name: 'View Material Inventory', key: 'view_material_inventory', description: 'Allows viewing raw material and packaging inventory' },
    { name: 'View Warehouse Inventory', key: 'view_warehouse_inventory', description: 'Allows viewing inventory by warehouse' },
    { name: 'View Inventory Summary', key: 'view_inventory_summary', description: 'Allows viewing aggregated inventory summaries' },
    { name: 'Manage Inventory', key: 'manage_inventory', description: 'Allows managing inventory records' },
    { name: 'Adjust Inventory', key: 'adjust_inventory', description: 'Allows making manual inventory adjustments' },
    { name: 'Manage Warehouse Inventory', key: 'manage_warehouse_inventory', description: 'Allows managing inventory inside warehouses' },
    { name: 'View Inventory Log', key: 'view_inventory_log', description: 'Allows viewing inventory log records' },
    
    // External and System
    { name: 'View External Data', key: 'view_external_data', description: 'Allows accessing external data for lot adjustment' },
    { name: 'View System', key: 'view_system', description: 'Allows viewing system-related data' },
    { name: 'View System Status', key: 'view_system_status', description: 'Allows viewing system health and uptime' },
    
    // Additional
    { name: 'View All Customers', key: 'view_all_customers', description: 'Allows viewing all customer profiles' },
    { name: 'View Active Customers', key: 'view_active_customers', description: 'Allows viewing active customer records' },
    { name: 'View All Product Statuses', key: 'view_all_product_statuses', description: 'Allows viewing all product status values' },
    { name: 'View All Warehouse Statuses', key: 'view_all_warehouse_statuses', description: 'Allows viewing all warehouse statuses including archived' },
    { name: 'View Archived Warehouses', key: 'view_archived_warehouses', description: 'Allows viewing archived warehouses' },
  ];
  
  // Warn for duplicate keys
  const seen = new Set();
  const duplicateKeys = permissions.map(p => p.key).filter((key) => {
    if (seen.has(key)) return true;
    seen.add(key);
    return false;
  });
  
  if (duplicateKeys.length > 0) {
    console.warn('[Permission Seed Warning] Duplicate permission keys found:', duplicateKeys);
  }
  
  let insertedCount = 0;
  
  for (const permission of permissions) {
    const id = knex.raw('uuid_generate_v4()');
    
    await knex('permissions')
      .insert({
        id,
        ...permission,
        ...baseFields,
      })
      .onConflict('key')
      .ignore();
    
    insertedCount++;
  }
  
  console.log(`${insertedCount} permissions processed (duplicates ignored in DB if existed).`);
};
