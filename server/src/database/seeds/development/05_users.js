const { fetchDynamicValue, fetchDynamicValues } = require('../03_utils');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Fetch required status ID
  const activeStatusId = await fetchDynamicValue(knex, 'status', 'name', 'active', 'id');
  
  // Fetch role IDs dynamically based on the existing roles
  const roleIds = await fetchDynamicValues(knex, 'roles', 'name', [
    'system',
    'admin',
    'manager',
    'sales',
    'marketing',
    'qa',
    'product_manager',
    'account',
    'inventory',
    'user',
    'manufacturing_director',
  ], 'id');
  
  // Insert the system user first (if it doesn’t exist)
  let systemUserId = await fetchDynamicValue(knex, 'users', 'email', 'system@internal.local', 'id');
  if (!systemUserId) {
    const insertedSystemUser = await knex('users')
      .insert({
        id: knex.raw('uuid_generate_v4()'),
        email: 'system@internal.local',
        firstname: 'System',
        lastname: 'Action',
        role_id: roleIds['system'],
        phone_number: null,
        job_title: 'System Process',
        status_id: activeStatusId,
        note: 'Reserved system user for automated actions.',
        status_date: new Date(),
        created_by: null,
        updated_by: null,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning('id'); // Fetch inserted ID
    
    systemUserId = insertedSystemUser[0].id;
  }
  
  // Define users
  const users = [
    {
      email: 'jp@widenaturals.com',
      firstname: 'JP',
      lastname: 'Zhao',
      job_title: 'Chairman of the Board',
      role_id: roleIds['manager'],
    },
    {
      email: 'andy@widenaturals.com',
      firstname: 'Andy',
      lastname: 'Qin',
      job_title: 'Account Manager',
      role_id: roleIds['product_manager'],
    },
    {
      email: 'claire@widenaturals.com',
      firstname: 'Claire',
      lastname: 'Li',
      job_title: 'Marketing Specialist',
      role_id: roleIds['marketing'],
    },
    {
      email: 'kajsa@widenaturals.com',
      firstname: 'Kajsa',
      lastname: 'Fritsch',
      job_title: 'Digital Marketing Specialist',
      role_id: roleIds['marketing'],
    },
    {
      email: 'barry@widenaturals.ca',
      firstname: 'Barry',
      lastname: 'Jeboult',
      job_title: 'NA Sales Lead',
      role_id: roleIds['sales'],
    },
    {
      email: 'keith@widenaturals.ca',
      firstname: 'Keith',
      lastname: 'Taverner',
      job_title: 'Director of Manufacturing',
      role_id: roleIds['manufacturing_director'],
    },
    {
      email: 'meison@widenaturals.ca',
      firstname: 'Meison',
      lastname: 'Yuan',
      job_title: 'Exclusive Assistant',
      role_id: roleIds['sales'],
    },
    {
      email: 'bob@widenaturals.ca',
      firstname: 'Bob',
      lastname: 'Zhou',
      job_title: 'Full Stack Web Developer',
      role_id: roleIds['inventory'],
    },
  ];
  
  // Format user data for insertion
  const formattedUsers = users.map(user => ({
    id: knex.raw('uuid_generate_v4()'),
    email: user.email,
    firstname: user.firstname,
    lastname: user.lastname,
    role_id: user.role_id || roleIds['user'], // Default to 'user' role if not found
    phone_number: user.phone_number || null,
    job_title: user.job_title,
    status_id: activeStatusId,
    note: null,
    status_date: new Date(),
    created_by: systemUserId, // Now correctly references the system user
    updated_by: null,
    created_at: new Date(),
    updated_at: null,
  }));
  
  // Insert users, ignoring duplicates
  await knex('users')
    .insert(formattedUsers)
    .onConflict(['email'])
    .ignore();
  
  console.log(`${formattedUsers.length} user records seeded successfully.`);
};
