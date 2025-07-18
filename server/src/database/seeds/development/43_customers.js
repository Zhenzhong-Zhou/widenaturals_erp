const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding customers...');

  const existing = await knex('customers').count('id as count').first();
  if (existing?.count > 0) {
    console.log('Customers already seeded. Skipping.');
    return;
  }

  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  const now = knex.fn.now();

  const statusMap = {
    active: await fetchDynamicValue(knex, 'status', 'name', 'active', 'id'),
    inactive: await fetchDynamicValue(knex, 'status', 'name', 'inactive', 'id'),
    pending: await fetchDynamicValue(knex, 'status', 'name', 'pending', 'id'),
    discontinued: await fetchDynamicValue(
      knex,
      'status',
      'name',
      'discontinued',
      'id'
    ),
    archived: await fetchDynamicValue(knex, 'status', 'name', 'archived', 'id'),
  };

  const customerList = [
    // Active customers
    {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
      phone_number: '6041234567',
      note: 'VIP customer',
      status: 'active',
    },
    {
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane.smith@example.com',
      phone_number: '7789876543',
      note: null,
      status: 'active',
    },
    {
      firstname: 'Alice',
      lastname: 'Wong',
      email: 'alice.wong@example.com',
      phone_number: '4162223333',
      note: 'Prefers email communication',
      status: 'active',
    },
    {
      firstname: 'Carlos',
      lastname: 'Diaz',
      email: 'carlos.diaz@example.com',
      phone_number: '6475551234',
      note: 'Spanish-speaking support preferred',
      status: 'active',
    },
    {
      firstname: 'Fatima',
      lastname: 'Ali',
      email: 'fatima.ali@example.com',
      phone_number: '5873217654',
      note: 'Frequent buyer',
      status: 'active',
    },
    {
      firstname: 'Liam',
      lastname: 'Nguyen',
      email: 'liam.nguyen@example.com',
      phone_number: '7781112233',
      note: null,
      status: 'active',
    },
    {
      firstname: 'Sophie',
      lastname: 'Martin',
      email: 'sophie.martin@example.com',
      phone_number: '5149876543',
      note: 'Billing contact for Acme Corp',
      status: 'active',
    },
    {
      firstname: 'David',
      lastname: 'Brown',
      email: 'david.brown@example.com',
      phone_number: '9052223344',
      note: null,
      status: 'active',
    },
    {
      firstname: 'Chen',
      lastname: 'Zhao',
      email: 'chen.zhao@example.com',
      phone_number: '4031237890',
      note: 'Contact via WeChat if urgent',
      status: 'active',
    },
    {
      firstname: 'Emily',
      lastname: 'Wilson',
      email: 'emily.wilson@example.com',
      phone_number: '2505556789',
      note: 'Seasonal customer',
      status: 'active',
    },
    // Inactive customer
    {
      firstname: 'Inactive',
      lastname: 'Customer',
      email: 'inactive.customer@example.com',
      phone_number: '6040000000',
      note: 'No longer active',
      status: 'inactive',
    },
    // Pending customer
    {
      firstname: 'Pending',
      lastname: 'Customer',
      email: 'pending.customer@example.com',
      phone_number: '7780000000',
      note: 'Awaiting verification',
      status: 'pending',
    },
    // Discontinued customer
    {
      firstname: 'Discontinued',
      lastname: 'Customer',
      email: 'discontinued.customer@example.com',
      phone_number: '4160000000',
      note: 'Legacy record',
      status: 'discontinued',
    },
    // Archived customer
    {
      firstname: 'Archived',
      lastname: 'Customer',
      email: 'archived.customer@example.com',
      phone_number: '9050000000',
      note: 'Historical reference',
      status: 'archived',
    },
  ];

  const records = customerList.map((cust) => ({
    id: knex.raw('uuid_generate_v4()'),
    firstname: cust.firstname,
    lastname: cust.lastname,
    email: cust.email,
    phone_number: cust.phone_number,
    status_id: statusMap[cust.status],
    note: cust.note,
    status_date: now,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));

  await knex('customers')
    .insert(records)
    .onConflict(['email', 'phone_number'])
    .ignore();

  console.log(`Seeded ${records.length} customers.`);
};
