const { fetchDynamicValue } = require('../03_utils');
const { generateChecksum } = require('../../../utils/hash-utils');

/**
 * @param { import("knex").Knex } knex
 */
exports.seed = async function (knex) {
  const existingInventory = await knex('warehouse_inventory as wi')
    .join('batch_registry as br', 'wi.batch_id', 'br.id')
    .whereNotNull('br.product_batch_id')
    .select('wi.id')
    .limit(1);
  
  if (existingInventory.length > 0) {
    console.log(
      'Skipping product inventory seed: product batches already in use.'
    );
    return;
  }
  
  console.log('Seeding warehouse_inventory...');
  
  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  if (!systemUserId) throw new Error('System user not found');
  
  const warehouses = await knex('warehouses').select('id', 'code');
  const statuses = await knex('inventory_status').select('id', 'name');
  const skus = await knex('skus as s')
    .join('products as p', 's.product_id', 'p.id')
    .select('s.id', 'p.name', 's.size_label', 's.country_code');
  
  const warehouseMap = Object.fromEntries(warehouses.map((w) => [w.code, w]));
  const statusMap = Object.fromEntries(statuses.map((s) => [s.name, s.id]));
  const skuMap = new Map(
    skus.map((s) => [`${s.name}__${s.size_label}__${s.country_code}`, s.id])
  );
  
  const batches = await knex('batch_registry as br')
    .join('product_batches as pb', 'br.product_batch_id', 'pb.id')
    .select('br.id as batch_id', 'pb.lot_number', 'pb.sku_id');
  
  const batchMap = new Map();
  for (const b of batches) {
    batchMap.set(`${b.lot_number}__${b.sku_id}`, b.batch_id);
  }
  
  const lotSeedData = {
    'WH-WNI-CA01': [
      // Canaherb
      {
        product_name: 'Focus',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11000001',
        expiry_date: '2026MAR07',
        warehouse_quantity: 2,
        status: 'unassigned',
      },
      {
        product: 'Focus',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11000004',
        expiry_date: '2026FEB13',
        warehouse_quantity: 74,
        status: 'in_stock',
      },
      {
        product: 'Focus',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11000001',
        expiry_date: '2026MAR07',
        warehouse_quantity: 8,
        status: 'unassigned',
      },
      {
        product: 'Focus',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11000002',
        expiry_date: '2025AUG24',
        warehouse_quantity: 6,
        status: 'in_stock',
      },
      {
        product: 'Gut Health',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11100004',
        expiry_date: '2026JAN20',
        warehouse_quantity: 24,
        status: 'in_stock',
      },
      {
        product: 'Gut Health',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11100005',
        expiry_date: '2026AUG11',
        warehouse_quantity: 12,
        status: 'in_stock',
      },
      {
        product: 'Gut Health',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11100001',
        expiry_date: '2026MAR07',
        warehouse_quantity: 4,
        status: 'in_stock',
      },
      {
        product: 'Hair Health',
        size_label: '60 Capsules',
        country_code: 'UN',
        lot_number: 'NTFS2E003',
        expiry_date: '2027-11-20',
        warehouse_quantity: 100,
        status: 'in_stock',
      },
      {
        product: 'Immune',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11300001',
        expiry_date: '2026MAR07',
        warehouse_quantity: 10,
        status: 'unassigned',
      },
      {
        product: 'Immune',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11300003',
        expiry_date: '2026FEB14',
        warehouse_quantity: 16,
        status: 'in_stock',
      },
      {
        product: 'Immune',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11300004',
        expiry_date: '2026APR05',
        warehouse_quantity: 105,
        status: 'in_stock',
      },
      {
        product: 'Immune',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: 'CM78737',
        expiry_date: '2027AUG25',
        warehouse_quantity: 97,
        status: 'in_stock',
      },
      {
        product: 'Immune',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11300001',
        expiry_date: '2025AUG25',
        warehouse_quantity: 1,
        status: 'in_stock',
      },
      {
        product: 'Immune',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11300002',
        expiry_date: '2025DEC21',
        warehouse_quantity: 2,
        status: 'in_stock',
      },
      {
        product: 'Immune',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11300004',
        expiry_date: '2026APR05',
        warehouse_quantity: 8,
        status: 'in_stock',
      },
      {
        product: 'Memory',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11400001?',
        expiry_date: '2026MAR07',
        warehouse_quantity: 10,
        status: 'unassigned',
      },
      {
        product: 'Memory',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11400001',
        expiry_date: '2025AUG10',
        warehouse_quantity: 12,
        status: 'in_stock',
      },
      {
        product: 'Memory',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11400003',
        expiry_date: '2026JAN24',
        warehouse_quantity: 31,
        status: 'in_stock',
      },
      {
        product: 'Memory',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11400001',
        expiry_date: '2026MAR07',
        warehouse_quantity: 12,
        status: 'unassigned',
      },
      {
        product: 'Memory',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11400003',
        expiry_date: '2026JAN25',
        warehouse_quantity: 39,
        status: 'in_stock',
      },
      {
        product: 'Memory',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11400004',
        expiry_date: '2026AUG10',
        warehouse_quantity: 8,
        status: 'in_stock',
      },
      {
        product: 'Menopause',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11500001',
        expiry_date: '2026MAR07',
        warehouse_quantity: 10,
        status: 'unassigned',
      },
      {
        product: 'Menopause',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11500002',
        expiry_date: '2026JUL05',
        warehouse_quantity: 53,
        status: 'in_stock',
      },
      {
        product: 'Menopause',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11800001',
        expiry_date: '2025OCT20',
        warehouse_quantity: 8,
        status: 'unassigned',
      },
      {
        product: 'Menopause',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11800003',
        expiry_date: '2025FEB16',
        warehouse_quantity: 7,
        status: 'in_stock',
      },
      {
        product: 'Mood',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '12800001?',
        expiry_date: '2026MAR20',
        warehouse_quantity: 4,
        status: 'unassigned',
      },
      {
        product: 'Mood',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '12800001',
        expiry_date: '2026MAR20',
        warehouse_quantity: 67,
        status: 'in_stock',
      },
      {
        product: 'Mood',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11900001',
        expiry_date: '2026MAR20',
        warehouse_quantity: 3,
        status: 'unassigned',
      },
      {
        product: 'Mood',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11900004',
        expiry_date: '2026AUG03',
        warehouse_quantity: 71,
        status: 'in_stock',
      },
      {
        product: 'Sleep',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11200004',
        expiry_date: '2026JUL11',
        warehouse_quantity: 51,
        status: 'suspended',
      },
      {
        product: 'Sleep',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: 'CS86736',
        expiry_date: '2027AUG11',
        warehouse_quantity: 7,
        status: 'in_stock',
      },
      // PG
      {
        product: 'NMN 3000',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '12000004',
        expiry_date: '2026APR24',
        warehouse_quantity: 61,
        status: 'in_stock',
      },
      {
        product: 'NMN 3000',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '12000005',
        expiry_date: '2026JUL20',
        warehouse_quantity: 100,
        status: 'in_stock',
      },
      {
        product: 'NMN 6000',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '12100003',
        expiry_date: '2025NOV23',
        warehouse_quantity: 18,
        status: 'in_stock',
      },
      {
        product: 'NMN 6000',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '12100004',
        expiry_date: '2026APR18',
        warehouse_quantity: 72,
        status: 'in_stock',
      },
      {
        product: 'NMN 6000',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '12100004',
        expiry_date: '2026APR18',
        warehouse_quantity: 55,
        status: 'in_stock',
      },
      {
        product: 'NMN 10000',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '12200005',
        expiry_date: '2026MAR07',
        warehouse_quantity: 0,
        status: 'out_of_stock',
      },
      {
        product: 'NMN 10000',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '12200008',
        expiry_date: '2027MAR05',
        warehouse_quantity: 34,
        status: 'in_stock',
      },
      {
        product: 'NMN 15000',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '12300012',
        expiry_date: '2027FEB13',
        warehouse_quantity: 14,
        status: 'in_stock',
      },
      {
        product: 'NMN 15000',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '12300013',
        expiry_date: '2027MAY15',
        warehouse_quantity: 32,
        status: 'in_stock',
      },
      {
        product: 'NMN 15000',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '12300014',
        expiry_date: '2027AUG29',
        warehouse_quantity: 71,
        status: 'in_stock',
      },
      {
        product: 'NMN 30000',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '12400007',
        expiry_date: '2026MAR02',
        warehouse_quantity: 0,
        status: 'out_of_stock',
      },
      {
        product: 'NMN 30000',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: 'VNN7E68C',
        expiry_date: '2027SEP18',
        warehouse_quantity: 153,
        status: 'in_stock',
      },
      // WIDE Naturals
      {
        product: 'Seal Oil Omega-3 500mg',
        size_label: '120 Softgels',
        country_code: 'UN',
        lot_number: 'NTSS2E002',
        expiry_date: '2027-10-20',
        warehouse_quantity: 3,
        status: 'in_stock',
      },
      {
        product: 'Seal Oil Omega-3 500mg',
        size_label: '180 Softgels',
        country_code: 'UN',
        lot_number: 'NTSS2E001',
        expiry_date: '2027-10-20',
        warehouse_quantity: 0,
        status: 'out_of_stock',
      },
    ],
    'WH-VTW-CA03': [
      {
        product: 'NMN 3000',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '12000005',
        expiry_date: '2027JUL20',
        warehouse_quantity: 48,
        status: 'in_stock',
      },
      {
        product: 'NMN 6000',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '12100004',
        expiry_date: '2026APR19',
        warehouse_quantity: 24,
        status: 'in_stock',
      },
      {
        product: 'NMN 6000',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '12100005',
        expiry_date: '2026JUL18',
        warehouse_quantity: 144,
        status: 'in_stock',
      },
      {
        product: 'Immune',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11300004',
        expiry_date: '2026APR05',
        warehouse_quantity: 36,
        status: 'in_stock',
      },
      {
        product: 'Menopause',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11500002',
        expiry_date: '2026JUL05',
        warehouse_quantity: 96,
        status: 'in_stock',
      },
      {
        product: 'Memory',
        size_label: '60 Capsules',
        country_code: 'CA',
        lot_number: '11400004',
        expiry_date: '2026AUG10',
        warehouse_quantity: 144,
        status: 'in_stock',
      },
      {
        product: 'Memory',
        size_label: '60 Capsules',
        country_code: 'CN',
        lot_number: '11400004',
        expiry_date: '2026AUG10',
        warehouse_quantity: 132,
        status: 'in_stock',
      },
    ],
  };
  
  const warehouseInventoryEntries = [];
  const skipped = [];
  
  for (const [warehouseCode, lots] of Object.entries(lotSeedData)) {
    const warehouse = warehouseMap[warehouseCode];
    if (!warehouse) {
      console.warn(`Missing warehouse for "${warehouseCode}"`);
      continue;
    }
    
    for (const lot of lots) {
      const productKey = `${lot.product_name || lot.product}__${lot.size_label}__${lot.country_code}`;
      const skuId = skuMap.get(productKey);
      if (!skuId) {
        console.warn(`No SKU found for key: ${productKey}`);
        continue;
      }
      
      const batchKey = `${lot.lot_number}__${skuId}`;
      const batchId = batchMap.get(batchKey);
      if (!batchId) {
        console.warn(
          `Skipping lot "${lot.lot_number}" — batch not found for SKU: ${skuId}`
        );
        continue;
      }
      
      const statusId = statusMap[lot.status];
      if (!statusId) {
        throw new Error(`Missing inventory_status for "${lot.status}"`);
      }
      
      const quantity = lot.warehouse_quantity;
      if (typeof quantity !== 'number' || quantity < 0) {
        skipped.push({ warehouseCode, lot_number: lot.lot_number, quantity });
        continue;
      }
      
      warehouseInventoryEntries.push({
        id: knex.raw('uuid_generate_v4()'),
        warehouse_id: warehouse.id,
        batch_id: batchId,
        warehouse_quantity: quantity,
        reserved_quantity: 0,
        warehouse_fee: 0,
        inbound_date: knex.fn.now(),
        outbound_date: null,
        last_movement_at: null,
        status_id: statusId,
        status_date: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
        created_by: systemUserId,
        updated_by: null,
      });
    }
  }
  
  if (skipped.length > 0) {
    console.warn(`Skipped ${skipped.length} lots with invalid quantities.`);
  }
  
  if (warehouseInventoryEntries.length === 0) {
    console.warn('No warehouse_inventory records to insert.');
    return;
  }
  
  await knex('warehouse_inventory')
    .insert(warehouseInventoryEntries)
    .onConflict(['warehouse_id', 'batch_id'])
    .ignore();
  
  console.log(
    `Inserted ${warehouseInventoryEntries.length} warehouse_inventory records.`
  );
  
  // Fetch inserted rows for activity log
  const insertedRows = await knex('warehouse_inventory')
    .select('id', 'warehouse_quantity', 'status_id', 'created_by', 'created_at')
    .whereIn(
      ['warehouse_id', 'batch_id'],
      warehouseInventoryEntries.map((e) => [e.warehouse_id, e.batch_id])
    );
  
  const initialLoadActionId = await fetchDynamicValue(
    knex,
    'inventory_action_types',
    'name',
    'initial_load',
    'id'
  );
  if (!initialLoadActionId) {
    throw new Error('Initial-load action type not found.');
  }
  
  const activityLogEntries = insertedRows.map((row) => {
    const logData = {
      warehouse_inventory_id: row.id,
      inventory_action_type_id: initialLoadActionId,
      previous_quantity: 0,
      quantity_change: row.warehouse_quantity,
      new_quantity: row.warehouse_quantity,
      status_id: row.status_id,
      status_effective_at: row.created_at,
      reference_type: null,
      reference_id: null,
      performed_by: row.created_by ?? systemUserId,
      comments: 'Initial inventory seed',
      metadata: { source: 'seed' },
      performed_at: row.created_at,
      created_at: row.created_at,
      created_by: row.created_by ?? systemUserId,
    };
    
    return {
      id: knex.raw('uuid_generate_v4()'),
      ...logData,
      checksum: generateChecksum(logData),
    };
  });
  
  if (activityLogEntries.length > 0) {
    await knex('inventory_activity_log').insert(activityLogEntries);
    console.log(
      `Inserted ${activityLogEntries.length} inventory_activity_log records.`
    );
  }
};
