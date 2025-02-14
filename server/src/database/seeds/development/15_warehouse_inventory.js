const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouse inventory data...');
  
  // Fetch required values dynamically
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  // Fetch existing warehouses
  const warehouses = await knex('warehouses').select('id');
  if (warehouses.length === 0) {
    console.error('No warehouses found! Ensure "warehouses" table is seeded first.');
    return;
  }
  
  // Fetch existing inventory
  const inventories = await knex('inventory').select('id', 'item_type', 'identifier');
  if (inventories.length === 0) {
    console.error('No inventory records found! Ensure "inventory" table is seeded first.');
    return;
  }
  
  // Limit total records to prevent PostgreSQL parameter overflow
  const totalEntries = Math.min(50, warehouses.length * inventories.length);
  const warehouseInventoryEntries = [];
  const batchSize = 10; // Reduce batch size to avoid parameter overflow
  
  for (let i = 0; i < totalEntries; i++) {
    const inventory = inventories[i % inventories.length]; // Fetch inventory record
    const warehouse = warehouses[i % warehouses.length]; // Fetch warehouse record
    
    // Ensure `reserved_quantity` never exceeds `total_quantity`
    const totalQuantity = Math.floor(Math.random() * 50) + 1; // Random value: 1 - 50
    const reservedQuantity = Math.floor(Math.random() * (totalQuantity + 1)); // Ensure it's ≤ total_quantity
    const availableQuantity = totalQuantity - reservedQuantity;
    
    warehouseInventoryEntries.push({
      id: knex.raw('uuid_generate_v4()'),
      warehouse_id: warehouse.id,
      inventory_id: inventory.id,
      total_quantity: totalQuantity,
      reserved_quantity: reservedQuantity, // Always valid
      available_quantity: availableQuantity,
      warehouse_fee: parseFloat((Math.random() * 50).toFixed(2)),
      last_update: knex.fn.now(),
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    });
    
    // Insert in batches
    if (warehouseInventoryEntries.length === batchSize || i === totalEntries - 1) {
      try {
        await knex('warehouse_inventory')
          .insert(warehouseInventoryEntries)
          .onConflict(['warehouse_id', 'inventory_id'])
          .ignore();
      } catch (error) {
        console.error('Error inserting batch:', error.message);
      }
      
      warehouseInventoryEntries.length = 0; // Clear batch for next insert
    }
  }
  
  console.log(`${totalEntries} warehouse inventory records seeded successfully.`);
};
