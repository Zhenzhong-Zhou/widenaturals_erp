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
  
  // Fetch existing product and location IDs
  const products = await knex('products').select('id');
  const locations = await knex('locations').select('id');
  
  if (!products.length || !locations.length) {
    console.error('Ensure products and locations tables are seeded first.');
    return;
  }
  
  // **Predefined static lot numbers** to prevent new inserts on every reboot
  const staticLotNumbers = [
    "LOT-202401", "LOT-202402", "LOT-202403", "LOT-202404", "LOT-202405",
    "LOT-202406", "LOT-202407", "LOT-202408", "LOT-202409", "LOT-202410",
    "LOT-202411", "LOT-202412", "LOT-202501", "LOT-202502", "LOT-202503",
    "LOT-202504", "LOT-202505", "LOT-202506", "LOT-202507", "LOT-202508"
  ];
  
  // Define inventory entries
  const inventoryEntries = [];
  for (let i = 0; i < 20; i++) {
    inventoryEntries.push({
      id: knex.raw('uuid_generate_v4()'),
      product_id: products[i % products.length].id,
      location_id: locations[i % locations.length].id,
      item_type: ['standard', 'fragile', 'bulk'][i % 3],
      lot_number: staticLotNumbers[i], // Using static lot numbers
      identifier: knex.raw('uuid_generate_v4()'),
      quantity: Math.floor(Math.random() * 500) + 10,
      manufacture_date: knex.raw("CURRENT_DATE - INTERVAL '30 days' * FLOOR(RANDOM() * 12)"),
      expiry_date: knex.raw("CURRENT_DATE + INTERVAL '30 days' * FLOOR(RANDOM() * 12)"),
      warehouse_fee: (Math.random() * 50).toFixed(2),
      inbound_date: knex.fn.now(),
      outbound_date: Math.random() > 0.5 ? knex.fn.now() : null,
      last_update: knex.fn.now(),
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    });
  }
  
  // Insert into the inventory table
  await knex('inventory')
    .insert(inventoryEntries)
    .onConflict(['product_id', 'location_id', 'lot_number', 'expiry_date'])
    .ignore(); // Avoid duplicate entries based on static lot_number
  
  console.log(`${inventoryEntries.length} inventory records seeded successfully.`);
};
