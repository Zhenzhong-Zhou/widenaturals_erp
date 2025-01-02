exports.seed = async function (knex) {
  const users = [
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'admin@example.com',
      firstname: 'Admin',
      lastname: 'User',
      role_id: await knex('roles')
        .where({ name: 'admin' })
        .select('id')
        .first()
        .then((row) => row.id),
      status_id: await knex('status')
        .where({ name: 'active' })
        .select('id')
        .first()
        .then((row) => row.id),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      email: 'manager@example.com',
      firstname: 'Manager',
      lastname: 'User',
      role_id: await knex('roles')
        .where({ name: 'manager' })
        .select('id')
        .first()
        .then((row) => row.id),
      status_id: await knex('status')
        .where({ name: 'active' })
        .select('id')
        .first()
        .then((row) => row.id),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ];
  await knex('users').insert(users);
};
