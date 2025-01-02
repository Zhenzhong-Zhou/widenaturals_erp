exports.seed = async function (knex) {
  // Fetch the 'Active' status ID from the 'status' table
  const activeStatusId = await knex('status')
    .where({ name: 'active' })
    .select('id')
    .first()
    .then((row) => row.id);

  // Seed roles
  const roles = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'admin',
      description: 'Administrator with full access',
      is_active: true,
      status_id: activeStatusId, // Add status_id
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'manager',
      description: 'Manager with limited administrative privileges',
      is_active: true,
      status_id: activeStatusId, // Add status_id
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'user',
      description: 'Regular user with basic access',
      is_active: true,
      status_id: activeStatusId, // Add status_id
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ];

  await knex('roles').insert(roles);
};
