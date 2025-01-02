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
  await knex('permissions').insert(permissions);
};
