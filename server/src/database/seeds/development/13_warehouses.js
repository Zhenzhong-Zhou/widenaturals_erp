const { fetchDynamicValue, fetchDynamicValues } = require('../03_utils');
const { generateStandardizedCode } = require('../../../utils/code-generators');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding warehouses...');

  // Fetch required values dynamically
  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
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
    ['distribution_center', 'storage_only'],
    'id'
  );
  
  const warehouseData = [
    {
      warehouse_name: 'WIDE Naturals Inc.',
      location_label: 'Head Office Warehouse',
      storage_capacity: 1000,
      type: 'distribution_center',
    },
    {
      warehouse_name: 'Richmond Storage',
      location_label: 'Richmond Warehouse',
      storage_capacity: 10000,
      type: 'storage_only',
    },
    {
      warehouse_name: 'Viktor Temporarily Warehouse',
      location_label: 'Viktor Temporarily Warehouse',
      storage_capacity: 5000,
      type: 'storage_only',
    },
  ];
  
  const warehouseLocations = await knex('locations')
    .where('location_type_id', warehouseLocationTypeId)
    .select('id', 'name');

  // Ensure each warehouse has a unique location
  const warehouseEntries = warehouseData
    .map((entry, index) => {
      const location = warehouseLocations.find(
        (loc) => loc.name === entry.location_label
      );
      
      const typeId = warehouseTypeMap[entry.type];
      
      if (!location || !typeId) {
        console.warn(
          `Skipping warehouse "${entry.warehouse_name}" — missing location or warehouse type "${entry.type}".`
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
        status_id: activeStatusId,
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
  
  // Insert warehouses & ignore duplicates
  if (warehouseEntries.length > 0) {
    await knex('warehouses')
      .insert(warehouseEntries)
      .onConflict(['name', 'location_id'])
      .ignore();
    
    console.log(`${warehouseEntries.length} warehouses seeded successfully.`);
  } else {
    console.log('No warehouse entries to seed.');
  }
};
