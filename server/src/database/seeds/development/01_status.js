exports.seed = async function(knex) {
  // Insert seed data into the 'status' table
  const statuses = [
    { id: knex.raw('uuid_generate_v4()'), name: 'active', is_active: true, created_at: knex.fn.now(), updated_at: knex.fn.now() },
    { id: knex.raw('uuid_generate_v4()'), name: 'inactive', is_active: false, created_at: knex.fn.now(), updated_at: knex.fn.now() },
    { id: knex.raw('uuid_generate_v4()'), name: 'pending', is_active: true, created_at: knex.fn.now(), updated_at: knex.fn.now() },
  ];
  await knex('status').insert(statuses);
};
