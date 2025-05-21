const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  console.log('Seeding packaging material inventory (Richmond)...');
  
  const systemUserId = await fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id');
  if (!systemUserId) throw new Error('System user not found');
  
  const warehouse = await knex('warehouses').whereILike('code', 'WH-RS-CA02').first();
  if (!warehouse) throw new Error('Richmond warehouse (WH-WNI-CA01) not found');
  
  const inStockStatusId = await fetchDynamicValue(knex, 'inventory_status', 'name', 'in_stock', 'id');
  
  const locationId = warehouse.location_id;
  const warehouseId = warehouse.id;
  
  const packagingBatches = await knex('packaging_material_batches as pmb')
    .join('batch_registry as br', 'br.packaging_material_batch_id', 'pmb.id')
    .select(
      'br.id as batch_id',
      'pmb.quantity',
      'pmb.status_id'
    );
  
  if (!packagingBatches.length) {
    console.warn('No packaging material batches found.');
    return;
  }
  
  const now = knex.fn.now();
  
  const locationInventory = packagingBatches.map(b => ({
    id: knex.raw('uuid_generate_v4()'),
    location_id: locationId,
    batch_id: b.batch_id,
    location_quantity: Math.floor(Number(b.quantity) || 0),
    reserved_quantity: 0,
    inbound_date: now,
    outbound_date: null,
    last_update: now,
    status_id: inStockStatusId,
    status_date: now,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  const warehouseInventory = packagingBatches.map(b => ({
    id: knex.raw('uuid_generate_v4()'),
    warehouse_id: warehouseId,
    batch_id: b.batch_id,
    warehouse_quantity: Math.floor(Number(b.quantity) || 0),
    reserved_quantity: 0,
    warehouse_fee: 0,
    inbound_date: now,
    outbound_date: null,
    last_update: now,
    status_id: inStockStatusId,
    status_date: now,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('location_inventory')
    .insert(locationInventory)
    .onConflict(['location_id', 'batch_id'])
    .ignore();
  
  await knex('warehouse_inventory')
    .insert(warehouseInventory)
    .onConflict(['warehouse_id', 'batch_id'])
    .ignore();
  
  console.log(`Inserted ${locationInventory.length} location_inventory records and ${warehouseInventory.length} warehouse_inventory records for packaging materials.`);
};
