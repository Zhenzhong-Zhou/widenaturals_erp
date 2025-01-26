exports.seed = async function (knex) {
  // Fetch the 'Active' status ID from the 'status' table
  const activeStatusId = await knex('status')
    .where({ name: 'active' })
    .select('id')
    .first()
    .then((row) => row?.id);

  if (!activeStatusId) {
    throw new Error("The 'active' status is not found in the 'status' table.");
  }

  // Define roles
  const roles = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'root_admin',
      description: 'Root administrator with full access',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'admin',
      description: 'Administrator with full access',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'manager',
      description: 'Manager with limited administrative privileges',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'user',
      description: 'Regular user with basic access',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'sales',
      description: 'Responsible for managing sales and customer relationships',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'operations',
      description: 'Handles operational tasks and logistics',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
  ];

  // Insert roles using ON CONFLICT to avoid duplicates
  for (const role of roles) {
    await knex('roles')
      .insert(role)
      .onConflict('name') // Use 'name' column to detect duplicates
      .ignore(); // Skip insertion if role already exists
  }

  console.log('Roles seeded successfully.');
};
