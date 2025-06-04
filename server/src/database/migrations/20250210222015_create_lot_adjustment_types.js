/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  await knex.schema.createTable('lot_adjustment_types', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).unique().notNullable().index();
    table.string('code', 50).unique().notNullable().index();
    table.string('slug', 50).unique();
    table.text('description');

    table.boolean('is_active').notNullable().defaultTo(true);

    table
      .uuid('inventory_action_type_id')
      .notNullable()
      .references('id')
      .inTable('inventory_action_types'); // parent action

    table.string('group', 50).nullable(); // Optional grouping: 'loss', 'damage', etc.

    // Timestamps
    table
      .timestamp('created_at', { useTz: true })
      .defaultTo(knex.fn.now())
      .index();
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    // Foreign Keys
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('lot_adjustment_types');
};
