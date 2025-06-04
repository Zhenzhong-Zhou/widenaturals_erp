/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('locations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table
      .uuid('location_type_id')
      .notNullable()
      .references('id')
      .inTable('location_types');
    table.string('name', 100).notNullable();

    // Structured address fields
    table.string('address_line1', 150);
    table.string('address_line2', 150);
    table.string('city', 100);
    table.string('province_or_state', 100);
    table.string('postal_code', 20);
    table.string('country', 100);

    table.boolean('is_archived').defaultTo(false);

    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    // Index for better performance
    table.index(['name', 'location_type_id'], 'idx_locations_name_type');
  });

  // Add unique constraint for (name, location_type_id)
  await knex.raw(`
    ALTER TABLE locations
    ADD CONSTRAINT unique_location_name_type
    UNIQUE (name, location_type_id)
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('locations');
};
