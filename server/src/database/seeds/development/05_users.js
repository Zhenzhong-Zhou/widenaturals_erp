const { fetchDynamicValues } = require('../03_utils');

exports.seed = async function (knex) {
  // Fetch role IDs dynamically
  const roleIds = await fetchDynamicValues(
    knex,
    'roles',
    'name',
    ['admin', 'manager', 'sales', 'operations', 'user'],
    'id'
  );

  // Fetch status IDs dynamically
  const statusIds = await fetchDynamicValues(
    knex,
    'status',
    'name',
    ['active'],
    'id'
  );

  // Define users
  const users = [
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'system@internal.local',
      firstname: 'System',
      lastname: 'Action',
      role_id: roleIds['system'], // Ensure you have a 'system' role defined
      status_id: statusIds['active'],
      created_at: knex.fn.now(),
      updated_at: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'admin@example.com',
      firstname: 'Admin',
      lastname: 'User',
      role_id: roleIds['admin'],
      status_id: statusIds['active'],
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'manager@example.com',
      firstname: 'Manager',
      lastname: 'User',
      role_id: roleIds['manager'],
      status_id: statusIds['active'],
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'jane.doe@example.com',
      firstname: 'Jane',
      lastname: 'Doe',
      phone_number: '1234567890',
      job_title: 'Sales Manager',
      role_id: roleIds['sales'],
      status_id: statusIds['active'],
      note: 'Experienced sales manager',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: null,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'john.smith@example.com',
      firstname: 'John',
      lastname: 'Smith',
      phone_number: '1122334455',
      job_title: 'Operations Manager',
      role_id: roleIds['operations'],
      status_id: statusIds['active'],
      note: 'Handles daily operations',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
      created_by: null,
      updated_by: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'emma.brown@example.com',
      firstname: 'Emma',
      lastname: 'Brown',
      phone_number: '9876543210',
      job_title: 'HR Manager',
      role_id: roleIds['manager'],
      status_id: statusIds['active'],
      note: 'HR specialist',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'will.jones@example.com',
      firstname: 'Will',
      lastname: 'Jones',
      phone_number: '4455667788',
      job_title: 'Finance Manager',
      role_id: roleIds['manager'],
      status_id: statusIds['active'],
      note: 'Finance and budget planning',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'sophia.lee@example.com',
      firstname: 'Sophia',
      lastname: 'Lee',
      phone_number: '9988776655',
      job_title: 'Marketing Manager',
      role_id: roleIds['manager'],
      status_id: statusIds['active'],
      note: 'Digital marketing expert',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'jack.clark@example.com',
      firstname: 'Jack',
      lastname: 'Clark',
      phone_number: '7766554433',
      job_title: 'Sales Executive',
      role_id: roleIds['sales'],
      status_id: statusIds['active'],
      note: 'Field sales specialist',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'olivia.hall@example.com',
      firstname: 'Olivia',
      lastname: 'Hall',
      phone_number: '6677889900',
      job_title: 'IT Specialist',
      role_id: roleIds['manager'],
      status_id: statusIds['active'],
      note: 'System administrator',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'michael.adams@example.com',
      firstname: 'Michael',
      lastname: 'Adams',
      phone_number: '5566778899',
      job_title: 'Operations Specialist',
      role_id: roleIds['operations'],
      status_id: statusIds['active'],
      note: 'Warehouse operations',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'newsales@example.com',
      firstname: 'Sales',
      lastname: 'New',
      phone_number: '3216549870',
      job_title: 'New Sales',
      role_id: roleIds['sales'],
      status_id: statusIds['active'],
      note: 'Sales operations',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'newuser1@example.com',
      firstname: 'User',
      lastname: 'New',
      phone_number: '4316549870',
      job_title: 'New User',
      role_id: roleIds['user'],
      status_id: statusIds['active'],
      note: 'User operations',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ];

  // Insert users and avoid duplicates
  for (const user of users) {
    await knex('users')
      .insert(user)
      .onConflict('email') // Skip if email already exists
      .ignore();
  }

  console.log(`${users.length} Users seeded successfully.`);
};
