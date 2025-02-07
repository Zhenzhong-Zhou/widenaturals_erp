const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding inventory data...');
  
  // Fetch required values dynamically
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
  
  // Fetch existing product, location, warehouse, and SKU IDs
  const products = await knex('products').select('id');
  const locations = await knex('locations').select('id');
  
  if (!products.length || !locations.length) {
    console.error('Ensure products, locations, and warehouses tables are seeded first.');
    return;
  }
  
  // Predefined item categories
  const itemTypes = ['finished_goods', 'raw_material', 'packaging'];
  
  // Define inventory entries
  const inventoryEntries = Array.from({ length: 20 }, (_, i) => ({
    id: knex.raw('uuid_generate_v4()'),
    product_id: products[i % products.length].id,
    location_id: locations[i % locations.length].id, // Assign location
    item_type: itemTypes[i % itemTypes.length],
    identifier: knex.raw('uuid_generate_v4()'),
    quantity: Math.floor(Math.random() * 500) + 10,
    inbound_date: knex.fn.now(),
    outbound_date: Math.random() > 0.5 ? knex.fn.now() : null,
    last_update: knex.fn.now(),
    status_id: activeStatusId,
    status_date: knex.fn.now(),
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
    created_by: adminUserId,
    updated_by: adminUserId,
  }));
  
  // Insert into the inventory table
  await knex('inventory')
    .insert(inventoryEntries)
    .onConflict(['product_id', 'location_id'])
    .ignore(); // Avoid duplicate entries based on static lot_number
  
  console.log(`${inventoryEntries.length} inventory records seeded successfully.`);
};
