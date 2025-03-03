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
      name: 'Manage Users',
      key: 'manage_users',
      description: 'Allows managing user accounts',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'View Prices',
      key: 'view_prices',
      description: 'Allows viewing price details',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Manage Prices',
      key: 'manage_prices',
      description: 'Allows updating price details',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'View Locations',
      key: 'view_locations',
      description: 'Allows viewing location details',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Manage Locations',
      key: 'manage_locations',
      description: 'Allows updating location details',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'View Warehouses',
      key: 'view_warehouses',
      description: 'Allows viewing warehouse details',
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'Manage Warehouses',
      key: 'manage_warehouses',
      description: 'Allows updating warehouse details',
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
    },
  ];

  for (const permission of permissions) {
    await knex('permissions')
      .insert(permission)
      .onConflict('key') // Use the `key` field for conflict resolution
      .ignore(); // Ignore the insertion if a conflict occurs
  }

  console.log(`${permissions.length} Permissions seeded successfully.`);
};
