exports.seed = async function (knex) {
  // Fetch the active status ID dynamically
  const activeStatusId = await knex('status')
    .select('id')
    .where('name', 'active')
    .first()
    .then((row) => row.id);

  const permissions = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'View Dashboard',
      key: 'view_dashboard',
      description: 'Allows viewing the dashboard',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Manage Users',
      key: 'manage_users',
      description: 'Allows managing user accounts',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Edit Profile',
      key: 'edit_profile',
      description: 'Allows editing user profiles',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'View Reports',
      key: 'view_reports',
      description: 'Allows viewing reports',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Create Admin',
      key: 'create_admin',
      description: 'Allows creating admin users',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Root Access',
      key: 'root_access',
      description: 'Grants access to all routes and operations',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    }
  ];

  for (const permission of permissions) {
    await knex('permissions')
      .insert(permission)
      .onConflict('key') // Use the `key` field for conflict resolution
      .ignore(); // Ignore the insertion if a conflict occurs
  }

  console.log('Permissions seeded successfully.');
};
