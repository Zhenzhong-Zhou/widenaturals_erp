exports.seed = async function (knex) {
  // Insert seed data into the 'status' table
  const statuses = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'active',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'inactive',
      is_active: false,
      created_at: knex.fn.now(),
      updated_at: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'pending',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'discontinued',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'archived',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: null,
    },
  ];

  // Use ON CONFLICT to avoid duplicates
  for (const status of statuses) {
    await knex('status')
      .insert(status)
      .onConflict('name') // Specify the column with the unique constraint
      .ignore(); // Ignore if the name already exists
  }

  console.log('Status seeded successfully.');
};
