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
  const warehouses = await knex('warehouses').select('id'); // If warehouse tracking is needed
  // const skus = await knex('skus').select('id'); // Fetch SKUs if SKU tracking is implemented
  
  // if (!products.length || !locations.length || !warehouses.length || !skus.length) {
  if (!products.length || !locations.length || !warehouses.length) {
    console.error('Ensure products, locations, warehouses, and SKUs tables are seeded first.');
    return;
  }
  
  // **Predefined static lot numbers** to prevent new inserts on every reboot
  const staticLotNumbers = Array.from({ length: 20 }, (_, i) => `LOT-20250${i + 1}`);
  
  // **Predefined item categories**
  const itemCategories = ['finished_goods', 'raw_material', 'packaging'];
  
  // Define inventory entries
  const inventoryEntries = Array.from({ length: 20 }, (_, i) => ({
    id: knex.raw('uuid_generate_v4()'),
    product_id: products[i % products.length].id,
    location_id: locations[i % locations.length].id,
    warehouse_id: warehouses[i % warehouses.length].id, // Assign warehouse
    // sku_id: skus[i % skus.length].id,
    item_type: ['standard', 'fragile', 'bulk'][i % 3],
    item_category: itemCategories[i % itemCategories.length], // Assign item category
    lot_number: staticLotNumbers[i], // Static lot numbers
    // batch_number: `BATCH-${1000 + i}`, /
    identifier: knex.raw('uuid_generate_v4()'),
    quantity: Math.floor(Math.random() * 500) + 10,
    manufacture_date: knex.raw("CURRENT_DATE - INTERVAL '30 days' * FLOOR(RANDOM() * 12)"),
    expiry_date: knex.raw("CURRENT_DATE + INTERVAL '30 days' * FLOOR(RANDOM() * 12)"),
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
    .onConflict(['product_id', 'location_id', 'lot_number', 'expiry_date'])
    .ignore(); // Avoid duplicate entries based on static lot_number
  
  console.log(`${inventoryEntries.length} inventory records seeded successfully.`);
};
