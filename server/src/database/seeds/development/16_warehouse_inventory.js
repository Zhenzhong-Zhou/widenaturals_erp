const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouse inventory and inventory lots...');

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

  const warehouses = await knex('warehouses').select('id');
  if (warehouses.length === 0) {
    console.error(
      'No warehouses found! Ensure "warehouses" table is seeded first.'
    );
    return;
  }

  const inventories = await knex('inventory').select('id');
  if (inventories.length === 0) {
    console.error(
      'No inventory records found! Ensure "inventory" table is seeded first.'
    );
    return;
  }

  // 🔹 Step 1: Insert Empty Warehouse Inventory Records First
  const warehouseInventoryEntries = warehouses.flatMap((warehouse) =>
    inventories.map((inventory) => ({
      id: knex.raw('uuid_generate_v4()'),
      warehouse_id: warehouse.id,
      inventory_id: inventory.id,
      reserved_quantity: 0, // Initially 0
      available_quantity: 0, // Initially 0
      warehouse_fee: parseFloat((Math.random() * 50).toFixed(2)),
      last_update: knex.fn.now(),
      status_id: inStockStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    }))
  );

  await knex('warehouse_inventory')
    .insert(warehouseInventoryEntries)
    .onConflict(['warehouse_id', 'inventory_id'])
    .ignore();
  console.log(
    `${warehouseInventoryEntries.length} warehouse inventory records seeded.`
  );

  // 🔹 Step 2: Insert Warehouse Inventory Lots
  const staticLotNumbers = Array.from(
    { length: 50 },
    (_, i) => `LOT-20250${i + 1}`
  );

  const warehouseInventoryLotEntries = warehouseInventoryEntries.map(
    (entry, i) => ({
      id: knex.raw('uuid_generate_v4()'),
      warehouse_id: entry.warehouse_id,
      inventory_id: entry.inventory_id,
      lot_number: staticLotNumbers[i % staticLotNumbers.length],
      quantity: Math.floor(Math.random() * 100) + 1, // Random Quantity
      manufacture_date: knex.raw(
        "CURRENT_DATE - INTERVAL '30 days' * FLOOR(RANDOM() * 12)"
      ),
      expiry_date: knex.raw(
        "CURRENT_DATE + INTERVAL '30 days' * FLOOR(RANDOM() * 12)"
      ),
      inbound_date: knex.fn.now(),
      outbound_date: Math.random() > 0.5 ? knex.fn.now() : null,
      status_id: inStockStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: adminUserId,
      updated_by: adminUserId,
    })
  );

  await knex('warehouse_inventory_lots')
    .insert(warehouseInventoryLotEntries)
    .onConflict(['warehouse_id', 'inventory_id', 'lot_number'])
    .ignore();
  console.log(
    `${warehouseInventoryLotEntries.length} warehouse inventory lot records seeded.`
  );

  // 🔹 Step 3: Update `warehouse_inventory` with Correct Reserved & Available Quantities
  const lotQuantities = await knex('warehouse_inventory_lots')
    .select('warehouse_id', 'inventory_id')
    .sum('quantity as total_quantity')
    .groupBy('warehouse_id', 'inventory_id');

  const lotQuantityMap = new Map();
  lotQuantities.forEach(({ warehouse_id, inventory_id, total_quantity }) => {
    lotQuantityMap.set(`${warehouse_id}-${inventory_id}`, total_quantity || 0);
  });

  for (const { warehouse_id, inventory_id, total_quantity } of lotQuantities) {
    const minReserved = Math.ceil(total_quantity * 0.1);
    const maxReserved = Math.ceil(total_quantity * 0.4);
    const reservedQuantity =
      total_quantity > 0
        ? Math.floor(
            Math.random() * (maxReserved - minReserved + 1) + minReserved
          )
        : 0;
    const availableQuantity = Math.max(0, total_quantity - reservedQuantity);
    
    // Check if warehouse inventory records exist
    const existingWarehouseInventory = await knex('warehouse_inventory').count('* as count').first();
    if (existingWarehouseInventory.count > 0) {
      console.log('⚠️ Warehouse inventory already seeded. Skipping seed process.');
      return;
    }

    // Update only if reserved_quantity is NULL or 0
    await knex('warehouse_inventory')
      .where({ warehouse_id, inventory_id })
      .where((builder) =>
        builder
          .where('reserved_quantity', 0)
          .orWhere('reserved_quantity', null)
      )
      .update({
        reserved_quantity: reservedQuantity,
        available_quantity: availableQuantity,
        last_update: knex.fn.now(),
      });
  }

  console.log('Warehouse inventory quantities updated successfully.');
};
