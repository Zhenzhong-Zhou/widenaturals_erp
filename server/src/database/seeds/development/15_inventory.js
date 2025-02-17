const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('🌱 Seeding inventory data...');
  
  try {
    // Fetch necessary dynamic values
    const inStockStatusId = await fetchDynamicValue(knex, 'warehouse_lot_status', 'name', 'in_stock', 'id');
    const adminUserId = await fetchDynamicValue(knex, 'users', 'email', 'admin@example.com', 'id');
    
    if (!inStockStatusId || !adminUserId) {
      console.error('❌ Missing required IDs. Ensure warehouse_lot_status and users tables are seeded first.');
      return;
    }
    
    // Fetch existing products
    const products = await knex('products').select('id');
    
    // Fetch existing locations, excluding "Head Office"
    const locations = await knex('locations')
      .select('id', 'name')
      .whereNot('name', 'Head Office');
    
    if (!products.length) {
      console.error('❌ Ensure products table is seeded first.');
      return;
    }
    
    if (!locations.length) {
      console.error('❌ No locations found (excluding Head Office). Ensure locations are seeded.');
      return;
    }
    
    console.log(`📦 Found ${products.length} products and ${locations.length} locations.`);
    
    // Generate inventory data
    const inventoryEntries = Array.from({ length: 1000 }, (_, i) => {
      const isProduct = Math.random() > 0.5; // 50% chance to be a product
      return {
        product_id: isProduct ? products[i % products.length].id : null,
        identifier: isProduct ? null : `RAW-${i + 1}`,
        location_id: locations[i % locations.length].id,
        item_type: isProduct ? 'finished_goods' : 'raw_material',
        quantity: Math.floor(Math.random() * 500) + 10,
        inbound_date: knex.fn.now(),
        status_id: inStockStatusId,
        status_date: knex.fn.now(),
        created_at: knex.fn.now(),
        created_by: adminUserId,
      };
    });
    
    console.log(`🔹 Preparing to insert ${inventoryEntries.length} inventory records...`);
    
    await knex.transaction(async (trx) => {
      console.log(`🚀 Processing each record separately to handle conflicts...`);
      
      for (const entry of inventoryEntries) {
        if (entry.product_id) {
          // Check if product inventory already exists at this location
          const existingRecord = await trx('inventory')
            .where({ location_id: entry.location_id, product_id: entry.product_id })
            .first();
          
          if (existingRecord) {
            // ✅ Update quantity instead of inserting duplicate
            await trx('inventory')
              .where({ location_id: entry.location_id, product_id: entry.product_id })
              .update({
                quantity: knex.raw('quantity + ?', [entry.quantity]),
                status_id: entry.status_id,
                status_date: knex.fn.now(),
                updated_at: knex.fn.now(),
                updated_by: adminUserId,
              });
          } else {
            // ✅ Insert new record
            await trx('inventory').insert(entry);
          }
        } else {
          // Check if raw material inventory already exists at this location
          const existingRecord = await trx('inventory')
            .where({ location_id: entry.location_id, identifier: entry.identifier })
            .first();
          
          if (existingRecord) {
            // ✅ Update quantity instead of inserting duplicate
            await trx('inventory')
              .where({ location_id: entry.location_id, identifier: entry.identifier })
              .update({
                quantity: knex.raw('quantity + ?', [entry.quantity]),
                status_id: entry.status_id,
                status_date: knex.fn.now(),
                updated_at: knex.fn.now(),
                updated_by: adminUserId,
              });
          } else {
            // ✅ Insert new record
            await trx('inventory').insert(entry);
          }
        }
      }
      
      console.log(`✅ Successfully processed ${inventoryEntries.length} inventory records.`);
    });
    
  } catch (error) {
    console.error('🚨 Error while inserting inventory records:', error);
  }
};
