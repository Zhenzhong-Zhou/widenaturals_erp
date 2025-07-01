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
  
  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );
  
  const now = knex.fn.now();
  
  const customerList = [
    {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
      phone_number: '6041234567',
      address_line1: '123 Main Street',
      address_line2: 'Unit 4B',
      city: 'Vancouver',
      state: 'BC',
      postal_code: 'V5K0A1',
      country: 'Canada',
      region: 'British Columbia',
      note: 'VIP customer',
    },
    {
      firstname: 'Jane',
      lastname: 'Smith',
      email: 'jane.smith@example.com',
      phone_number: '7789876543',
      address_line1: '456 Market Avenue',
      address_line2: null,
      city: 'Burnaby',
      state: 'BC',
      postal_code: 'V5C2H6',
      country: 'Canada',
      region: 'British Columbia',
      note: null,
    },
    {
      firstname: 'Alice',
      lastname: 'Wong',
      email: 'alice.wong@example.com',
      phone_number: '4162223333',
      address_line1: '789 King Street',
      address_line2: '',
      city: 'Toronto',
      state: 'ON',
      postal_code: 'M5V1M5',
      country: 'Canada',
      region: 'Ontario',
      note: 'Prefers email communication',
    },
  ];
  
  const records = customerList.map((cust) => ({
    id: knex.raw('uuid_generate_v4()'),
    firstname: cust.firstname,
    lastname: cust.lastname,
    email: cust.email,
    phone_number: cust.phone_number,
    address_line1: cust.address_line1,
    address_line2: cust.address_line2,
    city: cust.city,
    state: cust.state,
    postal_code: cust.postal_code,
    country: cust.country,
    region: cust.region,
    status_id: activeStatusId,
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
