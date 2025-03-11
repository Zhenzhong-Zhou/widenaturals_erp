const { fetchDynamicValue } = require('../03_utils');
const AppError = require('../../../utils/AppError');

exports.seed = async function (knex) {
  // Fetch the 'Active' status ID from the 'status' table
  const activeStatusId = await fetchDynamicValue(
    knex,
    'status',
    'name',
    'active',
    'id'
  );

  if (!activeStatusId) {
    throw AppError.notFoundError("The 'active' status is not found in the 'status' table.");
  }

  // Define roles
  const roles = [
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'system',
      description: 'System role for internal automated processes and actions',
      is_active: true, // Keep active for system actions
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
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
      name: 'sales',
      description: 'Handles sales operations and customer interactions',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'marketing',
      description: 'Responsible for marketing and promotional activities',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'qa',
      description: 'Quality Assurance role for product validation',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'product_manager',
      description: 'Manages product development and lifecycle',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'account',
      description: 'Handles financial transactions and accounting',
      is_active: true,
      status_id: activeStatusId,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    },
    {
      id: knex.raw('uuid_generate_v4()'),
      name: 'inventory',
      description: 'Manages inventory and warehouse operations',
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
