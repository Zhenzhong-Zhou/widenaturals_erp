exports.seed = async function (knex) {
  // Insert seed data into the 'status' table
  const statuses = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'active',
      is_active: true,
      description: 'Entity is currently active and operational.',
      created_at: knex.fn.now(),
      updated_at: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'inactive',
      is_active: false,
      description: 'Entity is currently inactive or disabled, but still retained in the system.',
      created_at: knex.fn.now(),
      updated_at: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'pending',
      is_active: true,
      description: 'Entity is in a transitional state and not fully active yet.',
      created_at: knex.fn.now(),
      updated_at: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'discontinued',
      is_active: true,
      description: 'Entity is no longer being produced or maintained, but historical data is kept.',
      created_at: knex.fn.now(),
      updated_at: null,
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'archived',
      is_active: true,
      description: 'Entity is archived for historical reference and is hidden from normal views.',
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
