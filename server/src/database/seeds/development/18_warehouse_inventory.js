const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouse inventory lots...');
  
  // Fetch necessary IDs
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
  const systemActionId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  // Fetch product IDs, location IDs, warehouse IDs, and inventory IDs
  const products = await knex('products').select('id', 'product_name');
  const locations = await knex('locations').select('id', 'name');
  const warehouses = await knex('warehouses').select('id', 'name');
  const inventory = await knex('inventory')
    .select('id', 'product_id', 'location_id', 'quantity');
  
  // Mapping data
  const productIdMap = Object.fromEntries(products.map((p) => [p.product_name, p.id]));
  const locationIdMap = Object.fromEntries(locations.map((l) => [l.name, l.id]));
  const warehouseIdMap = Object.fromEntries(warehouses.map((w) => [w.name, w.id]));
  const inventoryMap = inventory.reduce((acc, i) => {
    acc[`${i.product_id}_${i.location_id}`] = i.id;
    return acc;
  }, {});
  
  // Define Lot Data
  const lotData = [
    { product: 'Focus - CA', lot_number: 'UNASSIGNED-11000001', expiry_date: '2026Mar07', warehouse: 'Head Office', quantity: 2 },
    { product: 'Focus - CA', lot_number: '11000004', expiry_date: '2026-02-13', warehouse: 'Head Office', quantity: 84 },
    { product: 'Focus - INT', lot_number: 'UNASSIGNED-11000001', expiry_date: '2026Mar07', warehouse: 'Head Office', quantity: 8 },
    { product: 'Focus - INT', lot_number: '11000002', expiry_date: '2025-08-24', warehouse: 'Head Office', quantity: 6 },
    
    { product: 'Gut Health - CA', lot_number: '11100004', expiry_date: '2026-01-20', warehouse: 'Head Office', quantity: 27 },
    { product: 'Gut Health - CA', lot_number: '11100005', expiry_date: '2026-08-11', warehouse: 'Head Office', quantity: 12 },
    { product: 'Gut Health - INT', lot_number: 'UNASSIGNED-11100001', expiry_date: '2026Mar07', warehouse: 'Head Office', quantity: 4 },
    
    { product: 'Hair Health', lot_number: 'NTFS2E003', expiry_date: '2027-11-20', warehouse: 'Head Office', quantity: 124 },
    
    { product: 'Immune - CA', lot_number: 'UNASSIGNED-11300001', expiry_date: '2026Mar07', warehouse: 'Head Office', quantity: 10 },
    { product: 'Immune - CA', lot_number: '11300003', expiry_date: '2026-02-14', warehouse: 'Head Office', quantity: 29 },
    { product: 'Immune - CA', lot_number: '11300004', expiry_date: '2026-04-05', warehouse: 'Head Office', quantity: 105 },
    { product: 'Immune - CA', lot_number: 'CM78737', expiry_date: '2027-08-25', warehouse: 'Head Office', quantity: 100 },
    { product: 'Immune - INT', lot_number: '11300001', expiry_date: '2025-08-25', warehouse: 'Head Office', quantity: 1 },
    { product: 'Immune - INT', lot_number: '11300002', expiry_date: '2025-12-21', warehouse: 'Head Office', quantity: 2 },
    { product: 'Immune - INT', lot_number: '11300004', expiry_date: '2026-04-05', warehouse: 'Head Office', quantity: 8 },
    
    { product: 'Memory - CA', lot_number: 'UNASSIGNED-11400001', expiry_date: '2026Mar07', warehouse: 'Head Office', quantity: 10 },
    { product: 'Memory - CA', lot_number: '11400001', expiry_date: '2025-08-10', warehouse: 'Head Office', quantity: 12 },
    { product: 'Memory - CA', lot_number: '11400003', expiry_date: '2026-01-24', warehouse: 'Head Office', quantity: 32 },
    { product: 'Memory - INT', lot_number: 'UNASSIGNED-11400001', expiry_date: '2026Mar07', warehouse: 'Head Office', quantity: 12 },
    { product: 'Memory - INT', lot_number: '11400003', expiry_date: '2026-01-25', warehouse: 'Head Office', quantity: 39 },
    { product: 'Memory - INT', lot_number: '11400004', expiry_date: '2026-08-10', warehouse: 'Head Office', quantity: 8 },
    
    { product: 'Menopause - CA', lot_number: 'UNASSIGNED-11500001', expiry_date: '2026Mar07', warehouse: 'Head Office', quantity: 10 },
    { product: 'Menopause - CA', lot_number: '11500002', expiry_date: '2026-07-05', warehouse: 'Head Office', quantity: 41 },
    { product: 'Menopause - INT', lot_number: 'UNASSIGNED-11800001', expiry_date: '2025Oct20', warehouse: 'Head Office', quantity: 8 },
    { product: 'Menopause - INT', lot_number: '11800003', expiry_date: '2026-02-16', warehouse: 'Head Office', quantity: 7 },
    
    { product: 'Mood - CA', lot_number: 'UNASSIGNED-12800001', expiry_date: '2026Mar20', warehouse: 'Head Office', quantity: 4 },
    { product: 'Mood - CA', lot_number: '12800001', expiry_date: '2026-03-20', warehouse: 'Head Office', quantity: 82 },
    { product: 'Mood - INT', lot_number: 'UNASSIGNED-11900001', expiry_date: '2026Mar20', warehouse: 'Head Office', quantity: 3 },
    { product: 'Mood - INT', lot_number: '11900004', expiry_date: '2026-08-03', warehouse: 'Head Office', quantity: 71 },
    
    { product: 'Sleep - CA', lot_number: 'DAMAGED-11200003', expiry_date: '2026-05-10', warehouse: 'Head Office', quantity: 6 },
    { product: 'Sleep - CA', lot_number: 'SUSPENDED-11200004', expiry_date: '2026-07-11', warehouse: 'Head Office', quantity: 53 },
    { product: 'Sleep - CA', lot_number: 'CS86736', expiry_date: '2027-08-11', warehouse: 'Head Office', quantity: 30 },
    
    { product: 'NMN 3000 - CA', lot_number: '12000004', expiry_date: '2026-04-24', warehouse: 'Head Office', quantity: 91 },
    { product: 'NMN 3000 - INT', lot_number: '12000004', expiry_date: '2026-04-24', warehouse: 'Head Office', quantity: 11 },
    { product: 'NMN 3000 - INT', lot_number: '12000005', expiry_date: '2026-07-20', warehouse: 'Head Office', quantity: 100 },
    
    { product: 'NMN 6000 - CA', lot_number: '12100003', expiry_date: '2025-11-23', warehouse: 'Head Office', quantity: 18 },
    { product: 'NMN 6000 - CA', lot_number: '12100004', expiry_date: '2026-04-18', warehouse: 'Head Office', quantity: 72 },
    { product: 'NMN 6000 - INT', lot_number: '12100004', expiry_date: '2026-04-18', warehouse: 'Head Office', quantity: 55 },
    
    { product: 'NMN 10000 - CA', lot_number: '12200005', expiry_date: '2026-03-07', warehouse: 'Head Office', quantity: 1 },
    
    { product: 'NMN 15000 - CA', lot_number: '12300012', expiry_date: '2027-02-13', warehouse: 'Head Office', quantity: 14 },
    { product: 'NMN 15000 - INT', lot_number: '12300013', expiry_date: '2027-05-15', warehouse: 'Head Office', quantity: 33 },
    { product: 'NMN 15000 - INT', lot_number: '12300014', expiry_date: '2027-08-29', warehouse: 'Head Office', quantity: 71 },
    
    { product: 'NMN 30000 - CA', lot_number: '12400007', expiry_date: '2026-03-02', warehouse: 'Head Office', quantity: 3 },
    { product: 'NMN 30000 - INT', lot_number: 'VNN7E68C', expiry_date: '2027-09-18', warehouse: 'Head Office', quantity: 419 },
    
    { product: 'Seal Oil - 120 Softgels', lot_number: 'NTSS2E002', expiry_date: '2027-10-20', warehouse: 'Head Office', quantity: 200 },
    { product: 'Seal Oil - 180 Softgels', lot_number: 'NTSS2E001', expiry_date: '2027-10-20', warehouse: 'Head Office', quantity: 89 },
    
    { product: 'NMN 3000 - CA', lot_number: 'UNKNOWN', expiry_date: '2000-01-01', warehouse: 'Viktor Temporarily Warehouse', quantity: 100 },
    { product: 'NMN 3000 - INT', lot_number: '12000005', expiry_date: '2026-07-20', warehouse: 'Viktor Temporarily Warehouse', quantity: 48 },
    { product: 'NMN 6000 - INT', lot_number: '12100005', expiry_date: '2026-07-18', warehouse: 'Viktor Temporarily Warehouse', quantity: 144 },
    { product: 'Immune - CA', lot_number: '11300004', expiry_date: '2026-04-05', warehouse: 'Viktor Temporarily Warehouse', quantity: 36 },
    { product: 'Menopause - CA', lot_number: '11500002', expiry_date: '2026-07-05', warehouse: 'Viktor Temporarily Warehouse', quantity: 120 },
    { product: 'Memory - CA', lot_number: 'UNKNOWN-11400003', expiry_date: '2026-01-24', warehouse: 'Viktor Temporarily Warehouse', quantity: 192 },
    { product: 'Memory - INT', lot_number: 'UNKNOWN-11400004', expiry_date: '2026-08-10', warehouse: 'Viktor Temporarily Warehouse', quantity: 96 },
  ];
  
  // Insert into warehouse_inventory_lots
  const warehouseInventoryLots = lotData.map((lot) => {
    const productId = productIdMap[lot.product];
    const locationId = locationIdMap[lot.warehouse];
    const warehouseId = warehouseIdMap[lot.warehouse];
    const inventoryId = inventoryMap[`${productId}_${locationId}`];
    
    if (!productId || !locationId || !warehouseId || !inventoryId) {
      console.warn(
        `🚨 Debug: ${lot.product} -> productId: ${productId}, ${lot.warehouse} -> warehouseId: ${warehouseId}, ${lot.warehouse} -> locationId: ${locationId}, inventoryId: ${inventoryId}`
      );
      return null;
    }
    
    // 🟢 Determine correct status
    let lotStatus = inStockStatusId; // Default: in_stock
    if (!lot.lot_number || lot.lot_number.includes('UNASSIGNED')) {
      lotStatus = unassignedStatusId;
    } else if (lot.lot_number.includes('DAMAGED')) {
      lotStatus = damagedStatusId;
    } else if (lot.lot_number.includes('SUSPENDED')) {
      lotStatus = suspendedStatusId;
    } else if (lot.lot_number.includes('UNKNOWN')) {
      lotStatus = unavailableStatusId;
    } else if (lot.expiry_date && new Date(lot.expiry_date) < new Date()) {
      lotStatus = expiredStatusId;
    }
    
    return {
      id: knex.raw('uuid_generate_v4()'),
      warehouse_id: warehouseId,
      inventory_id: inventoryId,
      lot_number: lot.lot_number,
      quantity: lot.quantity,
      manufacture_date: null,
      expiry_date: lot.expiry_date ? knex.raw('?', [lot.expiry_date]) : null, // ✅ Fixed expiry_date
      inbound_date: knex.fn.now(),
      outbound_date: null,
      status_id: lotStatus,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    };
  }).filter(Boolean);
  
  for (const lot of warehouseInventoryLots) {
    await knex('warehouse_inventory_lots')
      .insert(lot)
      .onConflict(['warehouse_id', 'inventory_id', 'lot_number'])
      .ignore();
  }
  console.log(`✅ ${warehouseInventoryLots.length} warehouse inventory lots inserted successfully.`);
  
  // **Update warehouse_inventory**
  const warehouseInventory = lotData.reduce((acc, lot) => {
    const productId = productIdMap[lot.product];
    const locationId = locationIdMap[lot.warehouse];
    const warehouseId = warehouseIdMap[lot.warehouse];
    const inventoryId = inventoryMap[`${productId}_${locationId}`];
    
    // 🛑 Skip if any required ID is missing
    if (!inventoryId || !warehouseId) {
      console.warn(`Skipping inventory record: ${lot.product} at ${lot.warehouse} (Missing ID)`);
      return acc;
    }
    
    // 🟢 Determine if lot should count toward available stock
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
    }
    
    // Initialize inventory record if it doesn't exist
    if (!acc[inventoryId]) {
      acc[inventoryId] = {
        id: knex.raw('uuid_generate_v4()'),
        warehouse_id: warehouseId,
        inventory_id: inventoryId,
        reserved_quantity: 0, // ✅ Always 0
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
    
    // ✅ Update available quantity only for active lots
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
    
    console.log(`✅ ${warehouseInventoryEntries.length} warehouse inventory records updated.`);
  }
};