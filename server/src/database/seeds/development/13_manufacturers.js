const { fetchDynamicValue } = require('../03_utils');
const { generateStandardizedCode } = require('../../../utils/codeGenerators');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding manufacturers...');
  
  const [activeStatusId, discontinuedStatusId, systemActionId] = await Promise.all([
    fetchDynamicValue(knex, 'status', 'name', 'active', 'id'),
    fetchDynamicValue(knex, 'status', 'name', 'discontinued', 'id'),
    fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id'),
  ]);
  
  // Predefined manufacturer data
  const manufacturerLocations = [
    {
      company_name: 'Novastown Health',
      city: 'Burnaby',
    },
    {
      company_name: 'Canadian Phytopharmaceuticals',
      city: 'Richmond',
    },
    {
      company_name: 'Phyto-Matrix Natural Technologies',
      city: 'Kelowna',
      is_archived: true,
      status_id: discontinuedStatusId,
      status_date: '2024-11-01',
    },
  ];
  
  for (const [index, entry] of manufacturerLocations.entries()) {
    const location = await knex('locations')
      .select('id')
      .whereILike('name', `%${entry.company_name}%`)
      .andWhereILike('city', entry.city)
      .first();
    
    if (!location) {
      console.warn(`No matching location for manufacturer "${entry.company_name}"`);
      continue;
    }
    
    const manufacturer_code = generateStandardizedCode('MFG', entry.company_name, {
      regionCode: entry.city.slice(0, 2).toUpperCase(), // e.g., 'BU' from 'Burnaby'
      sequenceNumber: index + 1,
    });
    
    const manufacturer = {
      id: knex.raw('uuid_generate_v4()'),
      name: entry.company_name,
      code: manufacturer_code,
      contact_name: null,
      contact_email: null,
      contact_phone: null,
      location_id: location.id,
      is_archived: entry.is_archived || false,
      description: `Manufacturing facility operated by ${entry.company_name} in ${entry.city}`,
      status_id: entry.status_id || activeStatusId,
      status_date: entry.status_date || knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    };
    
    await knex('manufacturers')
      .insert(manufacturer)
      .onConflict(['name']) // unique constraint on name
      .ignore();
  }
  
  console.log('Manufacturer seed completed.');
};
