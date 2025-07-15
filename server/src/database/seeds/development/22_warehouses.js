const { fetchDynamicValue, fetchDynamicValues } = require('../03_utils');
const { generateStandardizedCode } = require('../../../utils/code-generators');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouses...');
  
  // Skip if warehouses table is already populated
  const existingCount = await knex('warehouses').count('* as count').first();
  if (existingCount?.count > 0) {
    console.log('Warehouses already seeded. Skipping...');
    return;
  }

  // Fetch required values dynamically
  const statusMap = await fetchDynamicValues(
    knex,
    'status',
    'name',
    ['active', 'inactive', 'pending', 'discontinued', 'archived'],
    'id'
  );
  
  const systemActionId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );
  
  const warehouseLocationTypeId = await fetchDynamicValue(
    knex,
    'location_types',
    'code',
    'WAREHOUSE',
    'id'
  );
  
  const warehouseTypeMap = await fetchDynamicValues(
    knex,
    'warehouse_types',
    'name',
    [
      'distribution_center',
      'storage_only',
      'cold_storage',
      'quarantine',
      'external',
    ],
    'id'
  );
  
  const warehouseData = [
    {
      warehouse_name: 'WIDE Naturals Inc.',
      location_label: 'Head Office Warehouse',
      storage_capacity: 1000,
      type: 'distribution_center',
      status: 'active',
    },
    {
      warehouse_name: 'Richmond Storage',
      location_label: 'Richmond Warehouse',
      storage_capacity: 10000,
      type: 'storage_only',
      status: 'active',
    },
    {
      warehouse_name: 'Viktor Temporarily Warehouse',
      location_label: 'Viktor Temporarily Warehouse',
      storage_capacity: 5000,
      type: 'storage_only',
      status: 'active',
    },
    {
      warehouse_name: 'Delta Backup Facility',
      location_label: 'Delta Reserve Warehouse',
      storage_capacity: 6000,
      type: 'storage_only',
      status: 'inactive',
    },
    {
      warehouse_name: 'Fridge Chamber',
      location_label: 'Cold Storage Area',
      storage_capacity: 2000,
      type: 'cold_storage',
      status: 'pending',
    },
    {
      warehouse_name: 'Inspection Zone',
      location_label: 'Quarantine Area',
      storage_capacity: 300,
      type: 'quarantine',
      status: 'discontinued',
    },
    {
      warehouse_name: 'Logistics Partner Hub',
      location_label: '3PL Partner Warehouse',
      storage_capacity: 8000,
      type: 'external',
      status: 'archived',
    },
  ];
  
  const warehouseLocations = await knex('locations')
    .where('location_type_id', warehouseLocationTypeId)
    .select('id', 'name');
  
  // Ensure each warehouse has a valid location, type, and status
  const warehouseEntries = warehouseData
    .map((entry, index) => {
      const location = warehouseLocations.find(
        (loc) => loc.name === entry.location_label
      );
      const typeId = warehouseTypeMap[entry.type];
      const statusId = statusMap[entry.status];
      
      if (!location || !typeId || !statusId) {
        console.warn(
          `Skipping warehouse "${entry.warehouse_name}" — missing ${
            !location ? 'location' : !typeId ? 'type' : 'status'
          }.`
        );
        return null;
      }
      
      return {
        id: knex.raw('uuid_generate_v4()'),
        name: entry.warehouse_name,
        location_id: location.id,
        type_id: typeId,
        code: generateStandardizedCode('WH', entry.warehouse_name, {
          regionCode: 'CA',
          sequenceNumber: index + 1,
          padLength: 2,
        }),
        storage_capacity: entry.storage_capacity,
        status_id: statusId,
        status_date: knex.fn.now(),
        is_archived: false,
        notes: null,
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: systemActionId,
        updated_by: null,
      };
    })
    .filter(Boolean);

  // Insert warehouses and ignore duplicates
  if (warehouseEntries.length > 0) {
    await knex('warehouses')
      .insert(warehouseEntries)
      .onConflict(['name', 'location_id'])
      .ignore();
    
    console.log(`${warehouseEntries.length} warehouses seeded successfully.`);
  } else {
    console.log('No valid warehouse entries to seed.');
  }
};
