exports.seed = async function (knex) {
  const permissions = [
    {
      id: knex.raw('uuid_generate_v4()'),
      permission: 'view_dashboard',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      permission: 'manage_users',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      permission: 'edit_profile',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      permission: 'view_reports',
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ];
  
  for (const permission of permissions) {
    await knex('permissions')
      .insert(permission)
      .onConflict('permission') // Specify the column with the unique constraint
      .ignore(); // Ignore the insertion if a conflict occurs
  }
  
  console.log('Permissions seeded successfully.');
};
