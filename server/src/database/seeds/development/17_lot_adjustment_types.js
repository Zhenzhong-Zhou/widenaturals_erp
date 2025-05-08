const { fetchDynamicValue } = require('../03_utils');
const { generateStandardizedCode, generateCodeOrSlug } = require('../../../utils/codeGenerators');

exports.seed = async function (knex) {
  const adminUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'admin@example.com',
    'id'
  );
  
  const lotAdjustmentTypes = [
    { name: 'manual_stock_insert', description: 'Stock was manually inserted into the system.' },
    { name: 'manual_stock_update', description: 'Stock records were manually updated after insertion.' },
    { name: 'damaged', description: 'Lot is physically damaged and cannot be used.' },
    { name: 'lost', description: 'Lot is missing or unaccounted for in stock.' },
    { name: 'defective', description: 'Lot has quality issues and cannot be sold.' },
    { name: 'expired', description: 'Lot has passed its expiration date and is unusable.' },
    { name: 'stolen', description: 'Lot was stolen and must be removed from inventory.' },
    { name: 'returned', description: 'Lot was returned by a customer or another department.' },
    { name: 'recalled', description: 'Lot was recalled due to safety or compliance issues.' },
    { name: 'adjustment', description: 'General adjustment due to stock discrepancies.' },
    { name: 'reclassified', description: 'Lot was moved from one category to another.' },
    { name: 'conversion', description: 'Lot was repurposed for another use (e.g., broken down into components).' },
    { name: 'transferred', description: 'Lot was moved from one warehouse/location to another.' },
    { name: 'quarantined', description: 'Lot was placed on hold for quality control or inspection.' },
    { name: 'resampled', description: 'Lot was used for quality testing or sampling.' },
    { name: 'repackaged', description: 'Lot was repackaged into a different size or configuration.' },
  ];
  
  let sequence = 1;
  
  for (const type of lotAdjustmentTypes) {
    const code = generateStandardizedCode('LAT', type.name, { sequenceNumber: sequence++ });
    const slug = generateCodeOrSlug(type.name, { sequenceNumber: sequence++ });
    
    await knex('lot_adjustment_types')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        name: type.name,
        code,
        slug,
        description: type.description,
        is_active: true,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
        created_by: adminUserId,
        updated_by: adminUserId,
      })
      .onConflict('name')
      .ignore();
  }
  
  console.log(`${lotAdjustmentTypes.length} lot adjustment types seeded successfully.`);
};
