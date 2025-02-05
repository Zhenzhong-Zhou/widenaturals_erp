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
  
  // Fetch existing warehouse and product IDs
  const warehouses = await knex('warehouses').select('id');
  const products = await knex('products').select('id');
  
  if (!warehouses.length || !products.length) {
    console.error('Ensure "warehouses" and "products" tables are seeded first.');
    return;
  }
  
  // Limit total records to prevent PostgreSQL parameter overflow
  const totalEntries = Math.min(50, warehouses.length * products.length);
  const warehouseInventoryEntries = [];
  
  for (let i = 0; i < totalEntries; i++) {
    warehouseInventoryEntries.push({
      id: knex.raw('uuid_generate_v4()'),
      warehouse_id: warehouses[i % warehouses.length].id,
      product_id: products[i % products.length].id,
      reserved_quantity: Math.max(1, Math.floor(Math.random() * 50)),
      warehouse_fee: parseFloat((Math.random() * 50).toFixed(2)),
      last_update: knex.fn.now(),
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    });
    
    // Insert in batches of 10 to avoid PostgreSQL parameter limits
    if (warehouseInventoryEntries.length === 10 || i === totalEntries - 1) {
      await knex('warehouse_inventory')
        .insert(warehouseInventoryEntries)
        .onConflict(['warehouse_id', 'product_id'])
        .ignore();
      
      warehouseInventoryEntries.length = 0; // Reset batch
    }
  }
  
  console.log(`${totalEntries} warehouse inventory records seeded successfully.`);
};
