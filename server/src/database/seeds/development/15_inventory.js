const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('🌱 Seeding inventory data...');

  try {
    // Fetch required dynamic values
    const inStockStatusId = await fetchDynamicValue(
      knex,
      'warehouse_lot_status',
      'name',
      'in_stock',
      'id'
    );
    const adminUserId = await fetchDynamicValue(
      knex,
      'users',
      'email',
      'admin@example.com',
      'id'
    );

    if (!inStockStatusId || !adminUserId) {
      console.error(
        '❌ Missing required IDs. Ensure warehouse_lot_status and users tables are seeded first.'
      );
      return;
    }

    // ✅ Step 1: Check if inventory already exists
    const existingInventoryCount = await knex('inventory')
      .count('* as count')
      .first();
    if (existingInventoryCount.count > 0) {
      console.log('⚠️ Inventory already seeded. Skipping seed process.');
      return;
    }

    // Fetch products & locations
    const products = await knex('products').select('id');
    const locations = await knex('locations')
      .select('id', 'name')
      .whereNot('name', 'Head Office');

    if (!products.length) {
      console.error('❌ Ensure products table is seeded first.');
      return;
    }
    if (!locations.length) {
      console.error(
        '❌ No locations found (excluding Head Office). Ensure locations are seeded.'
      );
      return;
    }

    console.log(
      `📦 Found ${products.length} products and ${locations.length} locations.`
    );

    // ✅ Step 2: Create Deterministic Inventory Data
    const inventoryEntries = [];
    for (let i = 0; i < 500; i++) {
      const isProduct = i % 2 === 0; // Alternate between product and non-product
      inventoryEntries.push({
        product_id: isProduct ? products[i % products.length].id : null,
        identifier: isProduct ? null : `RAW-${i + 1}`,
        location_id: locations[i % locations.length].id,
        item_type: isProduct ? 'finished_goods' : 'raw_material',
        quantity: 100, // Fixed quantity to prevent random growth
        inbound_date: knex.fn.now(),
        status_id: inStockStatusId,
        status_date: knex.fn.now(),
        created_at: knex.fn.now(),
        created_by: adminUserId,
      });
    }

    console.log(
      `🔹 Preparing to insert ${inventoryEntries.length} inventory records...`
    );

    // ✅ Step 3: Batch Insert Using `ON CONFLICT DO NOTHING`
    await knex.transaction(async (trx) => {
      console.log(`🚀 Inserting records...`);

      const productEntries = inventoryEntries.filter(
        (e) => e.product_id !== null
      );
      const identifierEntries = inventoryEntries.filter(
        (e) => e.identifier !== null
      );

      if (productEntries.length) {
        await trx('inventory')
          .insert(productEntries)
          .onConflict(['location_id', 'product_id']) // Unique constraint for product-based inventory
          .ignore();
      }

      if (identifierEntries.length) {
        await trx('inventory')
          .insert(identifierEntries)
          .onConflict(['location_id', 'identifier']) // Unique constraint for identifier-based inventory
          .ignore();
      }

      console.log(`✅ Successfully inserted inventory records.`);
    });
  } catch (error) {
    console.error('🚨 Error while inserting inventory records:', error);
  }
};
