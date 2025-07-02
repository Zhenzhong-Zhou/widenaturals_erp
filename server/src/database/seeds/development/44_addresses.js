const { fetchDynamicValue } = require('../03_utils');

/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.seed = async function (knex) {
  console.log('Seeding addresses...');
  
  const existing = await knex('addresses').count('id as count').first();
  if (existing?.count > 0) {
    console.log('Addresses already seeded. Skipping.');
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
  
  // Dynamically fetch customer IDs
  const johnCustomerId = await fetchDynamicValue(knex, 'customers', 'email', 'john.doe@example.com', 'id');
  const janeCustomerId = await fetchDynamicValue(knex, 'customers', 'email', 'jane.smith@example.com', 'id');
  const aliceCustomerId = await fetchDynamicValue(knex, 'customers', 'email', 'alice.wong@example.com', 'id');
  
  const customerEmailMap = {
    'johndoe@example.com': johnCustomerId,
    'janesmith@example.com': janeCustomerId,
    'alice.wong@example.com': aliceCustomerId,
  };
  
  const addressList = [
    {
      full_name: 'John Doe',
      email: 'johndoe@example.com',
      phone: '604-123-4567',
      label: 'Home',
      address_line1: '123 Main Street',
      address_line2: 'Unit 4B',
      city: 'Vancouver',
      state: 'BC',
      postal_code: 'V5K0A1',
      country: 'Canada',
      region: 'British Columbia',
      note: 'Leave at front door if no answer',
    },
    {
      full_name: 'Jane Smith',
      email: 'janesmith@example.com',
      phone: '778-987-6543',
      label: 'Work',
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
      full_name: 'Acme Corp',
      email: 'shipping@acmecorp.com',
      phone: '604-555-1212',
      label: 'Shipping',
      address_line1: '789 Industrial Way',
      address_line2: null,
      city: 'Richmond',
      state: 'BC',
      postal_code: 'V6V1K8',
      country: 'Canada',
      region: 'British Columbia',
      note: 'Dock 3, after 3 PM delivery preferred',
    },
    {
      full_name: 'Acme Corp',
      email: 'billing@acmecorp.com',
      phone: '604-555-1313',
      label: 'Billing',
      address_line1: '101 Financial Ave',
      address_line2: 'Suite 500',
      city: 'Vancouver',
      state: 'BC',
      postal_code: 'V6B3H2',
      country: 'Canada',
      region: 'British Columbia',
      note: 'Send invoices electronically where possible',
    },
    {
      full_name: 'Global Supplies',
      email: 'ship@globalsupplies.com',
      phone: '416-222-3333',
      label: 'Shipping',
      address_line1: '202 Logistic Blvd',
      address_line2: '',
      city: 'Toronto',
      state: 'ON',
      postal_code: 'M9W1J2',
      country: 'Canada',
      region: 'Ontario',
      note: 'Requires signature on delivery',
    },
    {
      full_name: 'Global Supplies',
      email: 'bill@globalsupplies.com',
      phone: '416-222-4444',
      label: 'Billing',
      address_line1: '303 Accounting Rd',
      address_line2: 'Floor 2',
      city: 'Toronto',
      state: 'ON',
      postal_code: 'M5V2T6',
      country: 'Canada',
      region: 'Ontario',
      note: 'Include PO number on all invoices',
    },
  ];
  
  const records = addressList.map((addr) => ({
    id: knex.raw('uuid_generate_v4()'),
    customer_id: customerEmailMap[addr.email] ?? null,
    full_name: addr.full_name,
    phone: addr.phone,
    email: addr.email,
    label: addr.label,
    address_line1: addr.address_line1,
    address_line2: addr.address_line2,
    city: addr.city,
    state: addr.state,
    postal_code: addr.postal_code,
    country: addr.country,
    region: addr.region,
    note: addr.note,
    created_at: now,
    updated_at: null,
    created_by: systemUserId,
    updated_by: null,
  }));
  
  await knex('addresses').insert(records);
  
  console.log(`Seeded ${records.length} addresses.`);
};
