const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding inventory for warehouses...');
  
  // Check if inventory table is empty
  const existingInventory = await knex('inventory').count('id as count').first();
  if (existingInventory.count > 0) {
    console.log('✅ Inventory already exists. Skipping seeding.');
    return;
  }
  
  // Fetch location IDs for warehouses
  const locations = await knex('locations')
    .whereIn('name', ['Head Office', 'Viktor Temporarily Warehouse', 'Novastown Health'])
    .select('id', 'name');
  
  const locationMap = locations.reduce((acc, location) => {
    acc[location.name] = location.id;
    return acc;
  }, {});
  
  if (!locationMap['Head Office'] || !locationMap['Viktor Temporarily Warehouse'] || !locationMap['Novastown Health']) {
    throw new Error('One or more warehouse locations not found.');
  }
  
  // Fetch active status ID for in-stock items
  const inStockStatusId = await knex('warehouse_lot_status')
    .where({ name: 'in_stock' })
    .select('id')
    .first()
    .then((row) => row?.id);
  
  if (!inStockStatusId) {
    throw new Error('In-stock status ID not found.');
  }
  
  const initialLoadActionId = await fetchDynamicValue(knex, 'inventory_action_types', 'name', 'initial_load', 'id');
  
  if (!initialLoadActionId) {
    throw new Error('Initial-load status ID not found.');
  }
  
  // Fetch system action user ID
  const systemActionId = await knex('users')
    .where({ email: 'system@internal.local' })
    .select('id')
    .first()
    .then((row) => row?.id);
  
  if (!systemActionId) {
    throw new Error('System user ID not found.');
  }
  
  // Define inventory data for warehouses
  const warehouseProductQuantities = {
    'Head Office': {
      'Focus - CA': 84,
      'Focus - INT': 6,
      'Gut Health - CA': 39,
      'Gut Health - INT': 4,
      'Hair Health': 124,
      'Immune - CA': 234,
      'Immune - INT': 11,
      'Memory - CA': 44,
      'Memory - INT': 47,
      'Menopause - CA': 41,
      'Menopause - INT': 7,
      'Mood - CA': 82,
      'Mood - INT': 71,
      'Sleep - CA': 91,
      'NMN 3000 - CA': 91,
      'NMN 3000 - INT': 111,
      'NMN 6000 - CA': 90,
      'NMN 6000 - INT': 55,
      'NMN 10000 - CA': 1,
      'NMN 10000 - INT': 88,
      'NMN 15000 - CA': 14,
      'NMN 15000 - INT': 104,
      'NMN 30000 - CA': 3,
      'NMN 30000 - INT': 419,
      'Seal Oil - 120 Softgels': 200,
      'Seal Oil - 180 Softgels': 89,
    },
    'Viktor Temporarily Warehouse': {
      'NMN 3000 - CA': 24,
      'NMN 3000 - INT': 48,
      'NMN 6000 - INT': 144,
      'Immune - CA': 36,
      'Menopause - CA': 120,
      'Memory - CA': 192,
      'Memory - INT': 96,
    },
    'Novastown Health' : {
      'Hair Health': 1757,
    }
  };
  
  // Fetch product IDs for all products in both warehouses
  const products = await knex('products')
    .whereIn('product_name', [
      ...Object.keys(warehouseProductQuantities['Head Office']),
      ...Object.keys(warehouseProductQuantities['Viktor Temporarily Warehouse'])
    ])
    .select('id', 'product_name');
  
  if (products.length === 0) {
    console.warn('No matching products found. Skipping inventory seeding.');
    return;
  }
  
  // Map product names to IDs
  const productIdMap = products.reduce((acc, product) => {
    acc[product.product_name] = product.id;
    return acc;
  }, {});
  
  // Prepare inventory entries for both warehouses
  const inventoryEntries = [];
  
  Object.entries(warehouseProductQuantities).forEach(([warehouse, productQuantities]) => {
    const locationId = locationMap[warehouse];
    
    Object.entries(productQuantities).forEach(([productName, quantity]) => {
      inventoryEntries.push({
        id: knex.raw('uuid_generate_v4()'),
        product_id: productIdMap[productName],
        location_id: locationId,
        item_type: 'finished_goods',
        identifier: null,
        quantity,
        inbound_date: knex.fn.now(),
        outbound_date: null,
        last_update: null,
        status_id: inStockStatusId,
        status_date: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: systemActionId,
        updated_by: null,
      });
    });
  });
  
  // Insert inventory data in bulk with `ON CONFLICT DO NOTHING`
  if (inventoryEntries.length > 0) {
    await knex('inventory')
      .insert(inventoryEntries)
      .onConflict(['product_id', 'location_id']) // If product already exists in location, do nothing
      .ignore();
    console.log(`✅ ${inventoryEntries.length} inventory records inserted successfully.`);
  } else {
    console.warn('⚠ No inventory records created.');
  }
  
  // Insert inventory data in bulk with `ON CONFLICT DO NOTHING`
  if (inventoryEntries.length > 0) {
    await knex('inventory')
      .insert(inventoryEntries)
      .onConflict(['product_id', 'location_id']) // If product already exists in location, do nothing
      .ignore();
    console.log(`✅ ${inventoryEntries.length} inventory records inserted successfully.`);
  }

  // Fetch aggregated inventory quantities across locations
  const aggregatedQuantities = await knex('inventory')
    .select('id as inventory_id') // Ensure `id` (PK) is selected, not `product_id`
    .sum('quantity as total_quantity')
    .groupBy('id'); // Group by `id` instead of `product_id`

  // Prepare inventory history entries for initial record
  const validInventoryIds = await knex('inventory').pluck('id'); // Fetch valid inventory IDs
  
  const inventoryHistoryEntries = aggregatedQuantities
    .filter(record => validInventoryIds.includes(record.inventory_id)) // Ensure ID exists
    .map(record => ({
      id: knex.raw('uuid_generate_v4()'),
      inventory_id: record.inventory_id, // Make sure this is the correct inventory_id
      inventory_action_type_id: initialLoadActionId,
      previous_quantity: 0,
      quantity_change: record.total_quantity,
      new_quantity: record.total_quantity,
      status_id: inStockStatusId,
      status_date: knex.fn.now(),
      timestamp: knex.fn.now(),
      source_action_id: systemActionId,
      comments: 'Initial inventory record',
      checksum: knex.raw('md5(? || ? || ?)', [
        record.inventory_id,
        initialLoadActionId,
        record.total_quantity,
      ]),
      metadata: JSON.stringify({ source: 'seed' }),
      created_at: knex.fn.now(),
      created_by: systemActionId,
    }));
  
  const BATCH_SIZE = 500;
  if (inventoryHistoryEntries.length > 0) {
    console.log(`Preparing to insert ${inventoryHistoryEntries.length} inventory history records...`);
    
    for (let i = 0; i < inventoryHistoryEntries.length; i += BATCH_SIZE) {
      const batch = inventoryHistoryEntries.slice(i, i + BATCH_SIZE);
      await knex('inventory_history').insert(batch);
      console.log(`✅ Inserted batch ${i / BATCH_SIZE + 1}/${Math.ceil(inventoryHistoryEntries.length / BATCH_SIZE)}`);
    }
  }
};
