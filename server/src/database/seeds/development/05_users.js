exports.seed = async function (knex) {
  // Fetch role IDs
  const roles = await knex('roles')
    .select('id', 'name')
    .whereIn('name', ['admin', 'manager']);
  
  const roleIds = roles.reduce((acc, role) => {
    acc[role.name] = role.id;
    return acc;
  }, {});
  
  // Fetch status IDs
  const statuses = await knex('status')
    .select('id', 'name')
    .whereIn('name', ['active']);
  
  const statusIds = statuses.reduce((acc, status) => {
    acc[status.name] = status.id;
    return acc;
  }, {});
  
  // Define users
  const users = [
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
  ];
  
  // Insert users and avoid duplicates
  for (const user of users) {
    await knex('users')
      .insert(user)
      .onConflict('email') // Skip if email already exists
      .ignore();
  }
  
  console.log('Users seeded successfully.');
};
