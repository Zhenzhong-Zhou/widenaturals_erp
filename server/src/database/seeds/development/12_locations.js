const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding locations...');

  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );

  const discontinuedStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'discontinued',
    'id'
  );

  const systemActionId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  const locationTypes = await knex('location_types').select('id', 'code');
  const getTypeId = (code) => locationTypes.find((t) => t.code === code)?.id;

  const locations = [
    {
      name: 'Head Office Warehouse',
      typeCode: 'WAREHOUSE',
      address_line1: '1040 W Georgia St',
      address_line2: 'Unit 1050',
      city: 'Vancouver',
      province_or_state: 'BC',
      postal_code: 'V6E 4H1',
      country: 'Canada',
    },
    {
      name: 'Head Office Canada',
      typeCode: 'VANCOUVER_OFFICE',
      address_line1: '1040 W Georgia St',
      address_line2: 'Unit 1050',
      city: 'Vancouver',
      province_or_state: 'BC',
      postal_code: 'V6E 4H1',
      country: 'Canada',
    },
    {
      name: 'Richmond Warehouse',
      typeCode: 'WAREHOUSE',
      address_line1: '11111 Twigg Pl',
      address_line2: 'Unit 1049 - 10151',
      city: 'Richmond',
      province_or_state: 'BC',
      postal_code: 'V6V 0B7',
      country: 'Canada',
    },
    {
      name: 'Viktor Temporarily Warehouse',
      typeCode: 'WAREHOUSE',
      address_line1: '160-2639 Viking Way',
      address_line2: 'Unit 160',
      city: 'Richmond',
      province_or_state: 'BC',
      postal_code: 'V6V 3B7',
      country: 'Canada',
    },
    {
      name: 'Novastown Health - Burnaby Facility',
      typeCode: 'MANUFACTURER',
      address_line1: '3728 N Fraser Wy',
      city: 'Burnaby',
      province_or_state: 'BC',
      postal_code: 'V5J 5H4',
      country: 'Canada',
    },
    {
      name: 'Canadian Phytopharmaceuticals - Richmond Facility',
      typeCode: 'MANUFACTURER',
      address_line1: '12233 Riverside Way',
      city: 'Richmond',
      province_or_state: 'BC',
      postal_code: 'V6W 1K8',
      country: 'Canada',
    },
    {
      name: 'Phyto-Matrix Natural Technologies - Kelowna Facility',
      typeCode: 'MANUFACTURER',
      address_line1: '544 Lawrence Ave',
      city: 'Kelowna',
      province_or_state: 'BC',
      postal_code: 'V1Y 6L7',
      country: 'Canada',
      is_archived: true,
      status_id: discontinuedStatusId,
      status_date: '2024-11-01',
    },
    {
      name: 'UNSPECIFIED Facility',
      typeCode: 'UNSPECIFIED',
      address_line1: 'N/A',
      city: 'Unspecified',
      province_or_state: 'N/A',
      postal_code: '00000',
      country: 'UNSPECIFIED',
      is_archived: false,
      status_id: activeStatusId,
    },
    {
      name: 'Delta Reserve Warehouse',
      typeCode: 'WAREHOUSE',
      address_line1: '123 Delta St',
      address_line2: 'Bldg A',
      city: 'Delta',
      province_or_state: 'BC',
      postal_code: 'V4K 3N2',
      country: 'Canada',
    },
    {
      name: 'Cold Storage Area',
      typeCode: 'WAREHOUSE',
      address_line1: '999 Icebox Ln',
      address_line2: 'Suite C',
      city: 'Vancouver',
      province_or_state: 'BC',
      postal_code: 'V5K 1A1',
      country: 'Canada',
    },
    {
      name: 'Quarantine Area',
      typeCode: 'WAREHOUSE',
      address_line1: '888 Isolate Rd',
      city: 'Burnaby',
      province_or_state: 'BC',
      postal_code: 'V5G 3H9',
      country: 'Canada',
    },
    {
      name: '3PL Partner Warehouse',
      typeCode: 'WAREHOUSE',
      address_line1: '777 Logistics Blvd',
      address_line2: 'Dock 4',
      city: 'Surrey',
      province_or_state: 'BC',
      postal_code: 'V3Z 0L5',
      country: 'Canada',
    },
  ];

  let insertedCount = 0;

  for (const loc of locations) {
    const location_type_id = getTypeId(loc.typeCode);
    if (!location_type_id) {
      console.warn(`Missing location type for: ${loc.name}`);
      continue;
    }

    const exists = await knex('locations')
      .where({ name: loc.name, location_type_id })
      .first();

    if (exists) {
      console.log(`Skipping existing location: ${loc.name}`);
      continue;
    }

    await knex('locations')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        name: loc.name,
        location_type_id,
        address_line1: loc.address_line1,
        address_line2: loc.address_line2 || null,
        city: loc.city,
        province_or_state: loc.province_or_state,
        postal_code: loc.postal_code,
        country: loc.country,
        is_archived: loc.is_archived ?? false,
        status_id: loc.status_id || activeStatusId,
        status_date: loc.status_date || knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: systemActionId,
        updated_by: null,
      })
      .onConflict(['name', 'location_type_id'])
      .ignore();

    insertedCount++;
  }

  console.log(`${insertedCount} locations inserted.`);
};
