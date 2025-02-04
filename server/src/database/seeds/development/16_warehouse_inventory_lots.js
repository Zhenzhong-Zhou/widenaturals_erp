const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouse inventory lots data...');
  
  // Ensure `warehouse_inventory` is populated first
  const warehouseInventory = await knex('warehouse_inventory').select('warehouse_id', 'product_id');
  if (!warehouseInventory.length) {
    console.error('🚨 No data in warehouse_inventory. Ensure it is seeded before running this script.');
    return;
  }
  
  // Fetch required values dynamically
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  // Predefined static lot numbers
  const staticLotNumbers = Array.from({ length: 50 }, (_, i) => `LOT-20250${i + 1}`);
  
  // Generate warehouse inventory lot data
  const warehouseInventoryLotEntries = warehouseInventory.map((entry, i) => ({
    id: knex.raw('uuid_generate_v4()'),
    warehouse_id: entry.warehouse_id, // Use valid warehouse-product pair
    product_id: entry.product_id,
    lot_number: staticLotNumbers[i % staticLotNumbers.length], // Ensure unique lot numbers
    quantity: Math.floor(Math.random() * 100) + 1, // Random quantity
    manufacture_date: knex.raw("CURRENT_DATE - INTERVAL '30 days' * FLOOR(RANDOM() * 12)"),
    expiry_date: knex.raw("CURRENT_DATE + INTERVAL '30 days' * FLOOR(RANDOM() * 12)"),
    inbound_date: knex.fn.now(),
    outbound_date: Math.random() > 0.5 ? knex.fn.now() : null,
    status_id: activeStatusId,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
    created_by: adminUserId,
    updated_by: adminUserId,
  }));
  
  // Insert data into warehouse_inventory_lots table
  await knex('warehouse_inventory_lots')
    .insert(warehouseInventoryLotEntries)
    .onConflict(['warehouse_id', 'product_id', 'lot_number'])
    .ignore(); // Avoid duplicate entries
  
  console.log(`${warehouseInventoryLotEntries.length} warehouse inventory lot records seeded successfully.`);
};
