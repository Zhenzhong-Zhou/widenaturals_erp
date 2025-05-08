const { generateStandardizedCode, generateSlugOnly } = require('../../../utils/codeGenerators');

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  const [activeStatusId, inactiveStatusId, systemActionId] = await Promise.all([
    knex('status').select('id').where('name', 'active').first().then(r => r?.id),
    knex('status').select('id').where('name', 'inactive').first().then(r => r?.id),
    knex('users').select('id').where('email', 'system@internal.local').first().then(r => r?.id),
  ]);
  
  const rawPricingTypes = [
    { name: 'MSRP', description: "Manufacturer's Suggested Retail Price.", status: 'active' },
    { name: 'Product Cost', description: 'The base cost of the product.', status: 'inactive' },
    { name: 'Retail', description: 'The price set for retail customers.', status: 'active' },
    { name: 'Friend and Family Price', description: 'Discounted price for friends and family.', status: 'active' },
    { name: 'Discount Price', description: 'Special discounted price for promotions.', status: 'inactive' },
    { name: 'Wholesale', description: 'Pricing for wholesale customers.', status: 'active' },
    { name: 'Employee Discount', description: 'Special discounted pricing available exclusively to company employees.', status: 'active' },
    { name: 'Sample Price', description: 'Price for product samples for marketing/testing.', status: 'active' },
    { name: 'Seasonal Discount', description: 'Special seasonal discounts.', status: 'inactive' },
    { name: 'Clearance', description: 'Pricing for clearance products.', status: 'inactive' },
    { name: 'Promotional', description: 'Pricing for promotional offers.', status: 'inactive' },
    { name: 'Loyalty Program Price', description: 'Special pricing for loyalty members.', status: 'inactive' },
    { name: 'Exclusive Member Price', description: 'Exclusive pricing for members.', status: 'inactive' },
    { name: 'Bulk Purchase Discount', description: 'Discounts for bulk purchases.', status: 'inactive' },
  ];
  
  let sequence = 1;
  
  for (const entry of rawPricingTypes) {
    const statusId = entry.status === 'active' ? activeStatusId : inactiveStatusId;
    const code = generateStandardizedCode('PRC', entry.name, { sequenceNumber: sequence++ });
    const slug = generateSlugOnly(entry.name);
    
    await knex('pricing_types')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        name: entry.name,
        code,
        slug,
        description: entry.description,
        status_id: statusId,
        status_date: knex.fn.now(),
        created_at: knex.fn.now(),
        updated_at: null,
        created_by: systemActionId,
        updated_by: null,
      })
      .onConflict('name')
      .ignore();
  }
  
  console.log(`${rawPricingTypes.length} pricing types seeded successfully.`);
};
