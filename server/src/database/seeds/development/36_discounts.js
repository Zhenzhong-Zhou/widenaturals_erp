const { fetchDynamicValue } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Fetch dynamically required values
  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );
  const inactiveStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'inactive',
    'id'
  );
  const systemActionId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  // Define discount records
  const discounts = [
    {
      name: 'Spring Sale 2025',
      discount_type: 'PERCENTAGE',
      discount_value: 15.0,
      status_id: activeStatusId,
      valid_from: new Date('2025-03-15T00:00:00Z'),
      valid_to: null,
      description:
        'Seasonal spring sale offering 15% off on selected products.',
      status_date: new Date('2025-03-15T00:00:00Z'),
    },
    {
      name: 'New Customer Offer',
      discount_type: 'FIXED_AMOUNT',
      discount_value: 20.0,
      status_id: activeStatusId,
      valid_from: new Date('2025-03-01T00:00:00Z'),
      valid_to: null,
      description: 'A one-time $20 discount for new customers.',
      status_date: new Date('2025-03-01T00:00:00Z'),
    },
    {
      name: 'Clearance',
      discount_type: 'PERCENTAGE',
      discount_value: 10.0,
      status_id: inactiveStatusId,
      valid_from: new Date('2025-02-01T00:00:00Z'),
      valid_to: new Date('2025-02-28T23:59:59Z'),
      description: 'End-of-season clearance sale offering 10% discount.',
      status_date: new Date('2025-02-01T00:00:00Z'),
    },
  ];

  // Format data before insertion
  const formattedDiscounts = discounts.map((discount) => ({
    id: knex.raw('uuid_generate_v4()'),
    name: discount.name,
    discount_type: discount.discount_type,
    discount_value: discount.discount_value,
    status_id: discount.status_id,
    valid_from: discount.valid_from,
    valid_to: discount.valid_to,
    description: discount.description,
    status_date: discount.status_date,
    created_by: systemActionId,
    updated_by: null,
    created_at: new Date(),
    updated_at: null,
  }));

  // Insert discounts while ignoring conflicts
  await knex('discounts')
    .insert(formattedDiscounts)
    .onConflict(['name', 'discount_type', 'valid_from'])
    .ignore();

  console.log(
    `${formattedDiscounts.length} discount records seeded successfully.`
  );
};
