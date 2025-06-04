/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('pricing', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('sku_id').notNullable().references('id').inTable('skus');
    table.uuid('price_type_id').notNullable().references('id').inTable('pricing_types');
    table.uuid('location_id').references('id').inTable('locations');
    table.decimal('price', 10, 2).notNullable();
    table.timestamp('valid_from', { useTz: true }).notNullable();
    table.timestamp('valid_to', { useTz: true }).nullable();
    
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
  
  // Update unique constraint
  await knex.raw(`
    ALTER TABLE pricing
    ADD CONSTRAINT unique_pricing_sku_type_location UNIQUE (sku_id, price_type_id, location_id, valid_from);
  `);
};

/**
 * @param { import("knex").Knex } knex
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('pricing');
};
