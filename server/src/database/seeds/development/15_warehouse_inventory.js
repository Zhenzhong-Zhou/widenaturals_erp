const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouse inventory data...');
  
  // Fetch active user and status IDs
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  // Fetch warehouses & products AFTER confirming they exist
  const warehouses = await knex('warehouses').select('id');
  const products = await knex('products').select('id');
  
  if (!warehouses.length || !products.length) {
    console.error('Ensure "warehouses" and "products" are seeded first.');
    return;
  }
  
  // Generate warehouse inventory entries
  for (let i = 0; i < 50; i++) {
    const warehouse = warehouses[i % warehouses.length];
    const product = products[i % products.length];
    
    // Re-fetch fresh data inside the loop
    const warehouseExists = await knex('warehouse_inventory')
      .where({ warehouse_id: warehouse.id, product_id: product.id })
      .first();
    
    if (!warehouseExists) {
      await knex('warehouse_inventory').insert({
        id: knex.raw('uuid_generate_v4()'),
        warehouse_id: warehouse.id,
        product_id: product.id,
        reserved_quantity: Math.floor(Math.random() * 50),
        warehouse_fee: parseFloat((Math.random() * 50).toFixed(2)),
        last_update: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
        created_by: adminUserId,
        updated_by: adminUserId,
      });
    }
  }
  
  console.log('Warehouse inventory seeding completed.');
};
