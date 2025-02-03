/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('locations', (table) => {
    table.uuid('id').primary();
    table.uuid('location_type_id').notNullable().references('id').inTable('location_types').onDelete('CASCADE'); // Ensure referential integrity
    table.string('name', 100).notNullable();
    table.text('address');
    table.decimal('warehouse_fee', 10, 2);
    table.uuid('status_id').notNullable().references('id').inTable('status').onDelete('CASCADE'); // Ensure referential integrity
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users').onDelete('SET NULL');
    table.uuid('updated_by').references('id').inTable('users').onDelete('SET NULL');
    
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
