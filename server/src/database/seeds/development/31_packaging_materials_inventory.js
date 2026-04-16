const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const existingInventory = await knex('warehouse_inventory as wi')
    .join('batch_registry as br', 'wi.batch_id', 'br.id')
    .whereNotNull('br.packaging_material_batch_id')
    .select('wi.id')
    .limit(1);
  
  if (existingInventory.length > 0) {
    console.log('Skipping packaging material inventory seed: already exists.');
    return;
  }
  
  console.log('Seeding packaging material inventory (Richmond)...');
  
  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  if (!systemUserId) throw new Error('System user not found');
  
  const warehouse = await knex('warehouses')
    .whereILike('code', 'WH-RS-CA02')
    .first();
  if (!warehouse) throw new Error('Richmond warehouse (WH-RS-CA02) not found');
  
  const inStockStatusId = await fetchDynamicValue(
    knex,
    'inventory_status',
    'name',
    'in_stock',
    'id'
  );
  
  const packagingBatches = await knex('packaging_material_batches as pmb')
    .join('batch_registry as br', 'br.packaging_material_batch_id', 'pmb.id')
    .select('br.id as batch_id', 'pmb.quantity', 'pmb.status_id');
  
  if (!packagingBatches.length) {
    console.warn('No packaging material batches found.');
    return;
  }
  
  const now = knex.fn.now();
  
  const warehouseInventory = packagingBatches.map((b) => ({
    id: knex.raw('uuid_generate_v4()'),
    warehouse_id: warehouse.id,
    batch_id: b.batch_id,
    warehouse_quantity: Math.floor(Number(b.quantity) || 0),
    reserved_quantity: 0,
    warehouse_fee: 0,
    inbound_date: now,
    outbound_date: null,
    last_movement_at: null,
    status_id: inStockStatusId,
    status_date: now,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('warehouse_inventory')
    .insert(warehouseInventory)
    .onConflict(['warehouse_id', 'batch_id'])
    .ignore();
  
  console.log(
    `Inserted ${warehouseInventory.length} warehouse_inventory records for packaging materials.`
  );
};
