const { fetchDynamicValue } = require('../03_utils');
const { generateChecksum } = require('../../../utils/crypto-utils');
const AppError = require('../../../utils/AppError');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding inventory and warehouse lots...');

  // 🛑 Skip seeding if inventory already exists
  const existingInventory = await knex('inventory')
    .count('id as count')
    .first();
  if (existingInventory.count > 0) {
    console.log('✅ Inventory already exists. Skipping seeding.');
    return;
  }

  // Fetch location, warehouse, and system user IDs
  const locations = await knex('locations').select('id', 'name');
  const warehouses = await knex('warehouses').select('id', 'name');
  const systemActionId = await knex('users')
    .where({ email: 'system@internal.local' })
    .select('id')
    .first()
    .then((row) => row?.id);

  if (!systemActionId)
    throw AppError.notFoundError('System user ID not found.');

  // Create ID maps
  const locationIdMap = Object.fromEntries(
    locations.map((l) => [l.name, l.id])
  );
  const warehouseIdMap = Object.fromEntries(
    warehouses.map((w) => [w.name, w.id])
  );

  // Fetch status IDs
  const statuses = await knex('warehouse_lot_status').select('id', 'name');
  const statusIdMap = Object.fromEntries(statuses.map((s) => [s.name, s.id]));

  // Fetch action ID
  const initialLoadActionId = await fetchDynamicValue(
    knex,
    'inventory_action_types',
    'name',
    'initial_load',
    'id'
  );
  if (!initialLoadActionId)
    throw new Error('Initial-load action ID not found.');

  // Define inventory data
  const warehouseProductQuantities = {
    'Head Office Warehouse': {
      'Focus - CA': 84,
      'Focus - INT': 14,
      'Gut Health - CA': 36,
      'Gut Health - INT': 4,
      'Hair Health': 110,
      'Immune - CA': 218,
      'Immune - INT': 11,
      'Memory - CA': 53,
      'Memory - INT': 59,
      'Menopause - CA': 63,
      'Menopause - INT': 15,
      'Mood - CA': 71,
      'Mood - INT': 74,
      'Sleep - CA': 75,
      'NMN 3000 - CA': 91,
      'NMN 3000 - INT': 111,
      'NMN 6000 - CA': 90,
      'NMN 6000 - INT': 55,
      'NMN 10000 - CA': 1,
      'NMN 10000 - INT': 88,
      'NMN 15000 - CA': 14,
      'NMN 15000 - INT': 103,
      'NMN 30000 - CA': 3,
      'NMN 30000 - INT': 388,
      'Seal Oil - 120 Softgels': 22,
      'Seal Oil - 180 Softgels': 0,
    },
    'Viktor Temporarily Warehouse': {
      'NMN 3000 - INT': 48,
      'NMN 6000 - CA': 24,
      'NMN 6000 - INT': 144,
      'Immune - CA': 36,
      'Menopause - CA': 96,
      'Memory - CA': 144,
      'Memory - INT': 132,
    },
    'Novastown Health': {
      'Hair Health': 1757,
    },
  };

  // Fetch product IDs
  const productNames = Object.keys(
    Object.assign({}, ...Object.values(warehouseProductQuantities))
  );

  const products = await knex('products')
    .whereIn('product_name', productNames)
    .select('id', 'product_name');

  const productIdMap = Object.fromEntries(
    products.map((p) => [p.product_name, p.id])
  );

  // Prepare and insert inventory records
  const inventoryEntries = [];
  Object.entries(warehouseProductQuantities).forEach(
    ([warehouse, productQuantities]) => {
      const locationId = locationIdMap[warehouse];
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
          status_id: statusIdMap['in_stock'],
          status_date: knex.fn.now(),
          created_at: knex.fn.now(),
          updated_at: null,
          created_by: systemActionId,
          updated_by: null,
        });
      });
    }
  );

  await knex('inventory')
    .insert(inventoryEntries)
    .onConflict(['product_id', 'location_id'])
    .ignore();

  console.log(`Inserted ${inventoryEntries.length} inventory records.`);

  // Fetch inventory records
  const inventory = await knex('inventory').select(
    'id',
    'product_id',
    'location_id'
  );
  const inventoryMap = Object.fromEntries(
    inventory.map((i) => [`${i.product_id}_${i.location_id}`, i.id])
  );

  // Define warehouse inventory lot data
  const lotData = [
    {
      product: 'Focus - CA',
      lot_number: 'UNASSIGNED-11000001',
      expiry_date: '2026Mar07',
      warehouse: 'Head Office Warehouse',
      quantity: 2,
    },
    {
      product: 'Focus - CA',
      lot_number: '11000004',
      expiry_date: '2026-02-13',
      warehouse: 'Head Office Warehouse',
      quantity: 82,
    },
    {
      product: 'Focus - INT',
      lot_number: 'UNASSIGNED-11000001',
      expiry_date: '2026Mar07',
      warehouse: 'Head Office Warehouse',
      quantity: 8,
    },
    {
      product: 'Focus - INT',
      lot_number: '11000002',
      expiry_date: '2025-08-24',
      warehouse: 'Head Office Warehouse',
      quantity: 6,
    },

    {
      product: 'Gut Health - CA',
      lot_number: '11100004',
      expiry_date: '2026-01-20',
      warehouse: 'Head Office Warehouse',
      quantity: 24,
    },
    {
      product: 'Gut Health - CA',
      lot_number: '11100005',
      expiry_date: '2026-08-11',
      warehouse: 'Head Office Warehouse',
      quantity: 12,
    },
    {
      product: 'Gut Health - INT',
      lot_number: 'UNASSIGNED-11100001',
      expiry_date: '2026Mar07',
      warehouse: 'Head Office Warehouse',
      quantity: 4,
    },

    {
      product: 'Hair Health',
      lot_number: 'NTFS2E003',
      expiry_date: '2027-11-20',
      warehouse: 'Head Office Warehouse',
      quantity: 110,
    },

    {
      product: 'Immune - CA',
      lot_number: 'UNASSIGNED-11300001',
      expiry_date: '2026Mar07',
      warehouse: 'Head Office Warehouse',
      quantity: 10,
    },
    {
      product: 'Immune - CA',
      lot_number: '11300003',
      expiry_date: '2026-02-14',
      warehouse: 'Head Office Warehouse',
      quantity: 16,
    },
    {
      product: 'Immune - CA',
      lot_number: '11300004',
      expiry_date: '2026-04-05',
      warehouse: 'Head Office Warehouse',
      quantity: 105,
    },
    {
      product: 'Immune - CA',
      lot_number: 'CM78737',
      expiry_date: '2027-08-25',
      warehouse: 'Head Office Warehouse',
      quantity: 97,
    },
    {
      product: 'Immune - INT',
      lot_number: '11300001',
      expiry_date: '2025-08-25',
      warehouse: 'Head Office Warehouse',
      quantity: 1,
    },
    {
      product: 'Immune - INT',
      lot_number: '11300002',
      expiry_date: '2025-12-21',
      warehouse: 'Head Office Warehouse',
      quantity: 2,
    },
    {
      product: 'Immune - INT',
      lot_number: '11300004',
      expiry_date: '2026-04-05',
      warehouse: 'Head Office Warehouse',
      quantity: 8,
    },

    {
      product: 'Memory - CA',
      lot_number: 'UNASSIGNED-11400001',
      expiry_date: '2026Mar07',
      warehouse: 'Head Office Warehouse',
      quantity: 10,
    },
    {
      product: 'Memory - CA',
      lot_number: '11400001',
      expiry_date: '2025-08-10',
      warehouse: 'Head Office Warehouse',
      quantity: 12,
    },
    {
      product: 'Memory - CA',
      lot_number: '11400003',
      expiry_date: '2026-01-24',
      warehouse: 'Head Office Warehouse',
      quantity: 31,
    },
    {
      product: 'Memory - INT',
      lot_number: 'UNASSIGNED-11400001',
      expiry_date: '2026Mar07',
      warehouse: 'Head Office Warehouse',
      quantity: 12,
    },
    {
      product: 'Memory - INT',
      lot_number: '11400003',
      expiry_date: '2026-01-25',
      warehouse: 'Head Office Warehouse',
      quantity: 39,
    },
    {
      product: 'Memory - INT',
      lot_number: '11400004',
      expiry_date: '2026-08-10',
      warehouse: 'Head Office Warehouse',
      quantity: 8,
    },

    {
      product: 'Menopause - CA',
      lot_number: 'UNASSIGNED-11500001',
      expiry_date: '2026Mar07',
      warehouse: 'Head Office Warehouse',
      quantity: 10,
    },
    {
      product: 'Menopause - CA',
      lot_number: '11500002',
      expiry_date: '2026-07-05',
      warehouse: 'Head Office Warehouse',
      quantity: 53,
    },
    {
      product: 'Menopause - INT',
      lot_number: 'UNASSIGNED-11800001',
      expiry_date: '2025Oct20',
      warehouse: 'Head Office Warehouse',
      quantity: 8,
    },
    {
      product: 'Menopause - INT',
      lot_number: '11800003',
      expiry_date: '2026-02-16',
      warehouse: 'Head Office Warehouse',
      quantity: 7,
    },

    {
      product: 'Mood - CA',
      lot_number: 'UNASSIGNED-12800001',
      expiry_date: '2026Mar20',
      warehouse: 'Head Office Warehouse',
      quantity: 4,
    },
    {
      product: 'Mood - CA',
      lot_number: '12800001',
      expiry_date: '2026-03-20',
      warehouse: 'Head Office Warehouse',
      quantity: 67,
    },
    {
      product: 'Mood - INT',
      lot_number: 'UNASSIGNED-11900001',
      expiry_date: '2026Mar20',
      warehouse: 'Head Office Warehouse',
      quantity: 3,
    },
    {
      product: 'Mood - INT',
      lot_number: '11900004',
      expiry_date: '2026-08-03',
      warehouse: 'Head Office Warehouse',
      quantity: 71,
    },

    {
      product: 'Sleep - CA',
      lot_number: 'DAMAGED-11200003',
      expiry_date: '2026-05-10',
      warehouse: 'Head Office Warehouse',
      quantity: 6,
    },
    {
      product: 'Sleep - CA',
      lot_number: 'SUSPENDED-11200004',
      expiry_date: '2026-07-11',
      warehouse: 'Head Office Warehouse',
      quantity: 53,
    },
    {
      product: 'Sleep - CA',
      lot_number: 'CS86736',
      expiry_date: '2027-08-11',
      warehouse: 'Head Office Warehouse',
      quantity: 16,
    },

    {
      product: 'NMN 3000 - CA',
      lot_number: '12000004',
      expiry_date: '2026-04-24',
      warehouse: 'Head Office Warehouse',
      quantity: 91,
    },
    {
      product: 'NMN 3000 - INT',
      lot_number: '12000004',
      expiry_date: '2026-04-24',
      warehouse: 'Head Office Warehouse',
      quantity: 11,
    },
    {
      product: 'NMN 3000 - INT',
      lot_number: '12000005',
      expiry_date: '2026-07-20',
      warehouse: 'Head Office Warehouse',
      quantity: 100,
    },

    {
      product: 'NMN 6000 - CA',
      lot_number: '12100003',
      expiry_date: '2025-11-23',
      warehouse: 'Head Office Warehouse',
      quantity: 18,
    },
    {
      product: 'NMN 6000 - CA',
      lot_number: '12100004',
      expiry_date: '2026-04-18',
      warehouse: 'Head Office Warehouse',
      quantity: 72,
    },
    {
      product: 'NMN 6000 - INT',
      lot_number: '12100004',
      expiry_date: '2026-04-18',
      warehouse: 'Head Office Warehouse',
      quantity: 55,
    },

    {
      product: 'NMN 10000 - CA',
      lot_number: '12200005',
      expiry_date: '2026-03-07',
      warehouse: 'Head Office Warehouse',
      quantity: 1,
    },
    {
      product: 'NMN 10000 - INT',
      lot_number: '12200008',
      expiry_date: '2027-03-05',
      warehouse: 'Head Office Warehouse',
      quantity: 88,
    },

    {
      product: 'NMN 15000 - CA',
      lot_number: '12300012',
      expiry_date: '2027-02-13',
      warehouse: 'Head Office Warehouse',
      quantity: 14,
    },
    {
      product: 'NMN 15000 - INT',
      lot_number: '12300013',
      expiry_date: '2027-05-15',
      warehouse: 'Head Office Warehouse',
      quantity: 32,
    },
    {
      product: 'NMN 15000 - INT',
      lot_number: '12300014',
      expiry_date: '2027-08-29',
      warehouse: 'Head Office Warehouse',
      quantity: 71,
    },

    {
      product: 'NMN 30000 - CA',
      lot_number: '12400007',
      expiry_date: '2026-03-02',
      warehouse: 'Head Office Warehouse',
      quantity: 3,
    },
    {
      product: 'NMN 30000 - INT',
      lot_number: 'VNN7E68C',
      expiry_date: '2027-09-18',
      warehouse: 'Head Office Warehouse',
      quantity: 388,
    },

    {
      product: 'Seal Oil - 120 Softgels',
      lot_number: 'NTSS2E002',
      expiry_date: '2027-10-20',
      warehouse: 'Head Office Warehouse',
      quantity: 22,
    },
    {
      product: 'Seal Oil - 180 Softgels',
      lot_number: 'NTSS2E001',
      expiry_date: '2027-10-20',
      warehouse: 'Head Office Warehouse',
      quantity: 0,
    },
    
    {
      product: 'NMN 3000 - INT',
      lot_number: '12000005',
      expiry_date: '2026-07-20',
      warehouse: 'Viktor Temporarily Warehouse',
      quantity: 48,
    },
    {
      product: 'NMN 6000 - CA',
      lot_number: '12100004',
      expiry_date: '2026-04-19',
      warehouse: 'Viktor Temporarily Warehouse',
      quantity: 24,
    },
    {
      product: 'NMN 6000 - INT',
      lot_number: '12100005',
      expiry_date: '2026-07-18',
      warehouse: 'Viktor Temporarily Warehouse',
      quantity: 144,
    },
    {
      product: 'Immune - CA',
      lot_number: '11300004',
      expiry_date: '2026-04-05',
      warehouse: 'Viktor Temporarily Warehouse',
      quantity: 36,
    },
    {
      product: 'Menopause - CA',
      lot_number: '11500002',
      expiry_date: '2026-07-05',
      warehouse: 'Viktor Temporarily Warehouse',
      quantity: 96,
    },
    {
      product: 'Memory - CA',
      lot_number: '11400004',
      expiry_date: '2026-08-10',
      warehouse: 'Viktor Temporarily Warehouse',
      quantity: 144,
    },
    {
      product: 'Memory - INT',
      lot_number: '11400004',
      expiry_date: '2026-08-10',
      warehouse: 'Viktor Temporarily Warehouse',
      quantity: 132,
    },
  ];

  // 🟢 Prepare warehouse lot entries
  const warehouseLotEntries = lotData
    .map((lot) => {
      const productId = productIdMap[lot.product];
      const locationId = locationIdMap[lot.warehouse];
      const warehouseId = warehouseIdMap[lot.warehouse];
      const inventoryId = inventoryMap[`${productId}_${locationId}`];

      if (!productId || !locationId || !warehouseId || !inventoryId)
        return null;

      // Determine correct status
      let lotStatus = statusIdMap['in_stock'];
      if (!lot.lot_number || lot.lot_number.includes('UNASSIGNED'))
        lotStatus = statusIdMap['unassigned'];
      else if (lot.lot_number.includes('DAMAGED'))
        lotStatus = statusIdMap['damaged'];
      else if (lot.lot_number.includes('SUSPENDED'))
        lotStatus = statusIdMap['suspended'];
      else if (lot.lot_number.includes('UNKNOWN'))
        lotStatus = statusIdMap['unavailable'];
      else if (new Date(lot.expiry_date) < new Date())
        lotStatus = statusIdMap['expired'];
      else if (lot.quantity === 0)
        lotStatus = statusIdMap['out_of_stock'];
      
      return {
        id: knex.raw('uuid_generate_v4()'),
        warehouse_id: warehouseId,
        inventory_id: inventoryId,
        lot_number: lot.lot_number,
        quantity: lot.quantity,
        manufacture_date: null,
        expiry_date: lot.expiry_date ? knex.raw('?', [lot.expiry_date]) : null, // Fixed expiry_date
        inbound_date: knex.fn.now(),
        outbound_date: null,
        status_id: lotStatus,
        status_date: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: systemActionId,
        updated_by: null,
      };
    })
    .filter(Boolean);

  await knex('warehouse_inventory_lots')
    .insert(warehouseLotEntries)
    .onConflict(['warehouse_id', 'inventory_id', 'lot_number'])
    .ignore();

  console.log(
    `Inserted ${warehouseLotEntries.length} warehouse inventory lots.`
  );

  // Fetch necessary IDs
  const outOfStockStatusId = await fetchDynamicValue(
    knex,
    'warehouse_lot_status',
    'name',
    'out_of_stock',
    'id'
  );
  const inStockStatusId = await fetchDynamicValue(
    knex,
    'warehouse_lot_status',
    'name',
    'in_stock',
    'id'
  );
  const unassignedStatusId = await fetchDynamicValue(
    knex,
    'warehouse_lot_status',
    'name',
    'unassigned',
    'id'
  );
  const damagedStatusId = await fetchDynamicValue(
    knex,
    'warehouse_lot_status',
    'name',
    'damaged',
    'id'
  );
  const suspendedStatusId = await fetchDynamicValue(
    knex,
    'warehouse_lot_status',
    'name',
    'suspended',
    'id'
  );
  const unavailableStatusId = await fetchDynamicValue(
    knex,
    'warehouse_lot_status',
    'name',
    'unavailable',
    'id'
  );
  const expiredStatusId = await fetchDynamicValue(
    knex,
    'warehouse_lot_status',
    'name',
    'expired',
    'id'
  );

  // **Update warehouse_inventory**
  const warehouseInventory = lotData.reduce((acc, lot) => {
    const productId = productIdMap[lot.product];
    const locationId = locationIdMap[lot.warehouse];
    const warehouseId = warehouseIdMap[lot.warehouse];
    const inventoryId = inventoryMap[`${productId}_${locationId}`];

    // Skip if any required ID is missing
    if (!inventoryId || !warehouseId) {
      console.warn(
        `Skipping inventory record: ${lot.product} at ${lot.warehouse} (Missing ID)`
      );
      return acc;
    }

    // Determine if lot should count toward available stock
    let lotStatus = inStockStatusId;
    let includeInAvailableStock = true;

    if (!lot.lot_number || lot.lot_number.includes('UNASSIGNED')) {
      lotStatus = unassignedStatusId;
      includeInAvailableStock = false;
    } else if (lot.lot_number.includes('DAMAGED')) {
      lotStatus = damagedStatusId;
      includeInAvailableStock = false;
    } else if (lot.lot_number.includes('SUSPENDED')) {
      lotStatus = suspendedStatusId;
      includeInAvailableStock = false;
    } else if (lot.expiry_date && new Date(lot.expiry_date) < new Date()) {
      lotStatus = expiredStatusId;
      includeInAvailableStock = false;
    } else if (lot.quantity === 0) {
      lotStatus = outOfStockStatusId;
      includeInAvailableStock = false;
    }
    
    // Initialize inventory record if it doesn't exist
    if (!acc[inventoryId]) {
      acc[inventoryId] = {
        id: knex.raw('uuid_generate_v4()'),
        warehouse_id: warehouseId,
        inventory_id: inventoryId,
        reserved_quantity: 0, // Always 0
        available_quantity: 0, // Will be updated
        warehouse_fee: 0, // Adjust as needed
        last_update: knex.fn.now(),
        status_id: lotStatus,
        status_date: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: systemActionId,
        updated_by: null,
      };
    }

    // Update available quantity only for active lots
    if (includeInAvailableStock) {
      acc[inventoryId].available_quantity += lot.quantity;
    }

    return acc;
  }, {});

  const warehouseInventoryEntries = Object.values(warehouseInventory);

  // **Insert into warehouse_inventory**
  if (warehouseInventoryEntries.length > 0) {
    await knex('warehouse_inventory')
      .insert(warehouseInventoryEntries)
      .onConflict(['warehouse_id', 'inventory_id'])
      .merge({ available_quantity: knex.raw('EXCLUDED.available_quantity') });

    console.log(
      `${warehouseInventoryEntries.length} warehouse inventory records updated.`
    );
  }

  // Update inventory statuses based on warehouse lot statuses
  await knex.raw(`
    WITH inventory_status_update AS (
      SELECT
        i.id AS inventory_id,
        COALESCE(
          (
            SELECT wls.id FROM warehouse_inventory_lots wil
            JOIN warehouse_lot_status wls ON wil.status_id = wls.id
            WHERE wil.inventory_id = i.id
            ORDER BY
              CASE
                WHEN wls.name = 'expired' THEN 1
                WHEN wls.name = 'suspended' THEN 2
                WHEN wls.name = 'unavailable' THEN 3
                WHEN wls.name = 'in_stock' THEN 4  -- Ensure in_stock gets selected if no other higher-priority status
                ELSE 5
              END
            LIMIT 1
          ),
          (
            SELECT wls.id FROM warehouse_inventory_lots wil
            JOIN warehouse_lot_status wls ON wil.status_id = wls.id
            WHERE wil.inventory_id = i.id AND wls.name = 'in_stock'
            LIMIT 1
          ),
          (
            SELECT wls.id FROM warehouse_lot_status wls WHERE wls.name = 'unassigned' LIMIT 1
          )
        ) AS correct_status_id
      FROM inventory i
    )
    UPDATE inventory i
    SET status_id = isu.correct_status_id
    FROM inventory_status_update isu
    WHERE i.id = isu.inventory_id;
  `);

  console.log('Inventory statuses updated successfully.');

  // Fetch updated inventory records with correct status_id and summed quantity
  const updatedInventoryRecords = await knex('inventory as i')
    .select('i.id as inventory_id')
    .sum('i.quantity as total_quantity')
    .select(
      knex.raw(`
      COALESCE(
        (SELECT wil.status_id FROM warehouse_inventory_lots wil WHERE wil.inventory_id = i.id ORDER BY wil.status_id LIMIT 1),
        i.status_id
      ) AS status_id
    `)
    )
    .groupBy('i.id');

  // Prepare inventory history entries with checksum
  const inventoryHistoryEntries = updatedInventoryRecords.map((record) => ({
    id: knex.raw('uuid_generate_v4()'),
    inventory_id: record.inventory_id,
    inventory_action_type_id: initialLoadActionId,
    previous_quantity: 0,
    quantity_change: record.total_quantity, // Use summed quantity
    new_quantity: record.total_quantity, // Ensure correct total quantity
    status_id: record.status_id, // Use updated status_id
    status_date: knex.fn.now(),
    timestamp: knex.fn.now(),
    source_action_id: systemActionId,
    comments: 'Initial inventory record',
    checksum: generateChecksum(
      record.inventory_id,
      initialLoadActionId,
      0, // previous_quantity
      record.total_quantity,
      record.total_quantity,
      systemActionId,
      'Initial inventory record'
    ),
    metadata: JSON.stringify({ source: 'seed' }),
    created_at: knex.fn.now(),
    created_by: systemActionId,
  }));

  const BATCH_SIZE = 500;
  // Batch insert inventory history
  if (inventoryHistoryEntries.length > 0) {
    console.log(
      `Inserting ${inventoryHistoryEntries.length} inventory history records...`
    );
    for (let i = 0; i < inventoryHistoryEntries.length; i += BATCH_SIZE) {
      const batch = inventoryHistoryEntries.slice(i, i + BATCH_SIZE);
      await knex('inventory_history').insert(batch);
      console.log(
        `Inserted batch ${i / BATCH_SIZE + 1}/${Math.ceil(inventoryHistoryEntries.length / BATCH_SIZE)}`
      );
    }
  }
};
