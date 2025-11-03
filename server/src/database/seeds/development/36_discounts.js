const { fetchDynamicValue, fetchDynamicValues } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  const [{ count }] = await knex('discounts').count('id');
  const total = parseInt(count, 10) || 0;

  if (total > 0) {
    console.log(
      `[${new Date().toISOString()}] [SEED] Skipping discounts seed: ${total} records already exist.`
    );
    return;
  }

  console.log(
    `[${new Date().toISOString()}] [SEED] Starting discounts seeding...`
  );

  // Fetch status IDs
  const statusIds = await fetchDynamicValues(
    knex,
    'status',
    'name',
    ['active', 'inactive', 'discontinued', 'archived'],
    'id'
  );

  const getStatusId = (name) => {
    const id = statusIds[name];
    if (!id) throw new Error(`Status "${name}" not found in DB.`);
    return id;
  };

  const activeStatusId = getStatusId('active');
  const inactiveStatusId = getStatusId('inactive');
  const discontinuedStatusId = getStatusId('discontinued');
  const archivedStatusId = getStatusId('archived');

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
    },
    {
      name: 'New Customer Offer',
      discount_type: 'FIXED_AMOUNT',
      discount_value: 20.0,
      status_id: activeStatusId,
      valid_from: new Date('2025-03-01T00:00:00Z'),
      valid_to: null,
      description: 'A one-time $20 discount for new customers.',
    },
    {
      name: 'Clearance',
      discount_type: 'PERCENTAGE',
      discount_value: 10.0,
      status_id: inactiveStatusId,
      valid_from: new Date('2025-02-01T00:00:00Z'),
      valid_to: new Date('2025-02-28T23:59:59Z'),
      description: 'End-of-season clearance sale offering 10% discount.',
    },
    {
      name: 'Black Friday Blowout',
      discount_type: 'PERCENTAGE',
      discount_value: 25.0,
      status_id: archivedStatusId,
      valid_from: new Date('2024-11-29T00:00:00Z'),
      valid_to: new Date('2024-11-30T23:59:59Z'),
      description: 'Archived discount from last year’s Black Friday.',
    },
    {
      name: 'End of Year Sale',
      discount_type: 'FIXED_AMOUNT',
      discount_value: 50.0,
      status_id: discontinuedStatusId,
      valid_from: new Date('2024-12-20T00:00:00Z'),
      valid_to: new Date('2024-12-31T23:59:59Z'),
      description: 'Discontinued promotion at year-end.',
    },
    {
      name: 'Subscriber Reward',
      discount_type: 'PERCENTAGE',
      discount_value: 5.0,
      status_id: activeStatusId,
      valid_from: new Date('2025-07-05T12:00:00Z'),
      valid_to: null,
      description: 'Ongoing reward for newsletter subscribers.',
    },
    {
      name: 'Flash Sale 1-Hour Only',
      discount_type: 'PERCENTAGE',
      discount_value: 30,
      status_id: activeStatusId,
      valid_from: new Date('2025-07-01T12:00:00Z'),
      valid_to: new Date('2025-07-01T13:00:00Z'),
      description: 'Flash sale for one hour only.',
    },
    {
      name: 'Archived Promo Test',
      discount_type: 'FIXED_AMOUNT',
      discount_value: 99,
      status_id: archivedStatusId,
      valid_from: new Date('2023-01-01T00:00:00Z'),
      valid_to: new Date('2023-01-31T23:59:59Z'),
      description:
        'Old archived promo for testing audit and inactive record handling.',
    },
  ];

  // Format data before insertion
  const formatted = discounts.map((d) => ({
    id: knex.raw('uuid_generate_v4()'),
    name: d.name,
    discount_type: d.discount_type,
    discount_value: d.discount_value,
    status_id: d.status_id,
    valid_from: d.valid_from,
    valid_to: d.valid_to,
    description: d.description,
    status_date: d.status_date,
    created_by: systemActionId,
    updated_by: null,
    updated_at: null,
  }));

  // Insert discounts while ignoring conflicts
  await knex('discounts')
    .insert(formatted)
    .onConflict(['name', 'discount_type', 'valid_from'])
    .ignore();

  console.log(
    `${formatted.length} discount records seeded (skipping existing).`
  );
};
