const { fetchDynamicValue } = require('../03_utils');
const { generateStandardizedCode } = require('../../../utils/codeGenerators');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding suppliers...');
  
  const [activeStatusId, systemUserId] = await Promise.all([
    fetchDynamicValue(knex, 'status', 'name', 'active', 'id'),
    fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id'),
  ]);
  
  const supplierEntries = [
    {
      name: 'Phyto-Matrix Inc.',
      contact_name: 'Anna Li',
      contact_email: 'anna.li@phytomatrix.com',
      contact_phone: '+1-604-123-4567',
      location_city: 'Kelowna',
    },
    {
      name: 'Novastown Biotech',
      contact_name: 'John Wu',
      contact_email: 'john.wu@novastownbio.cn',
      contact_phone: '+86-21-9876-5432',
      location_city: 'Burnaby',
    },
    {
      name: 'Herbalex Naturals Ltd.',
      contact_name: 'Sarah Tan',
      contact_email: 'sarah.tan@herbalex.ca',
      contact_phone: '+1-416-555-0199',
      location_city: 'Toronto',
    },
    {
      name: 'Guangdong Nutrients',
      contact_name: 'Chen Ming',
      contact_email: 'ming.chen@gdnutrients.cn',
      contact_phone: '+86-20-7654-3210',
      location_city: 'Guangzhou',
    },
    {
      name: 'Internal Supplier',
      contact_name: 'ERP Admin',
      contact_email: 'admin@internal.local',
      contact_phone: null,
      location_city: 'Richmond',
    },
  ];
  
  for (let i = 0; i < supplierEntries.length; i++) {
    const entry = supplierEntries[i];
    
    const location = await knex('locations')
      .select('id')
      .whereILike('city', entry.location_city)
      .first();
    
    if (!location) {
      console.warn(`No matching location for supplier "${entry.name}"`);
      continue;
    }
    
    const supplier_code = generateStandardizedCode('SUP', entry.name, {
      regionCode: entry.location_city.slice(0, 2).toUpperCase(),
      sequenceNumber: i + 1,
    });
    
    const supplier = {
      id: knex.raw('uuid_generate_v4()'),
      name: entry.name,
      supplier_code,
      contact_name: entry.contact_name,
      contact_email: entry.contact_email,
      contact_phone: entry.contact_phone,
      location_id: location.id,
      is_archived: false,
      description: `Registered supplier: ${entry.name}, located in ${entry.location_city}`,
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemUserId,
      updated_by: null,
    };
    
    await knex('suppliers')
      .insert(supplier)
      .onConflict(['name'])
      .ignore();
  }
  
  console.log('Suppliers seed completed.');
};
