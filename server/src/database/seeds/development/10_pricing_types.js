/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  // Fetch dynamic values for status and user IDs
  const activeStatusId = await knex('status')
    .select('id')
    .where('name', 'active')
    .first()
    .then((row) => row?.id);
  const inactiveStatusId = await knex('status')
    .select('id')
    .where('name', 'inactive')
    .first()
    .then((row) => row?.id);
  const systemActionId = await knex('users')
    .select('id')
    .where('email', 'system@internal.local')
    .first()
    .then((row) => row?.id);

  // Define pricing types
  const pricingTypes = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'MSRP',
      description: "Manufacturer's Suggested Retail Price.",
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Product Cost',
      description: 'The base cost of the product.',
      status_id: inactiveStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Retail',
      description: 'The price set for retail customers.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Friend and Family Price',
      description: 'Discounted price for friends and family.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Discount Price',
      description: 'Special discounted price for promotions.',
      status_id: inactiveStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Wholesale',
      description: 'Pricing for wholesale customers.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Sample Price',
      description:
        'Price for product samples distributed for marketing or testing purposes.',
      status_id: activeStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Seasonal Discount',
      description: 'Special seasonal discounts.',
      status_id: inactiveStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Clearance',
      description: 'Pricing for clearance products.',
      status_id: inactiveStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Promotional',
      description: 'Pricing for promotional offers.',
      status_id: inactiveStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Loyalty Program Price',
      description: 'Special pricing for loyalty program members.',
      status_id: inactiveStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Exclusive Member Price',
      description: 'Exclusive pricing for members only.',
      status_id: inactiveStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Bulk Purchase Discount',
      description: 'Special discounts for bulk purchases.',
      status_id: inactiveStatusId,
      status_date: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: null,
      created_by: systemActionId,
      updated_by: null,
    },
  ];

  // Insert data with ON CONFLICT to avoid duplicates
  for (const pricingType of pricingTypes) {
    await knex('pricing_types')
      .insert(pricingType)
      .onConflict('name') // Specify the column with the unique constraint
      .ignore(); // Ignore if the name already exists
  }

  console.log(`${pricingTypes.length} pricing types seeded successfully.`);
};
