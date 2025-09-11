/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('tracking_numbers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('order_id').references('id').inTable('orders');
    table.string('tracking_number', 255).unique().nullable();
    table.string('carrier', 100).notNullable();
    table.string('service_name', 100).nullable();
    table.string('bol_number', 100).nullable(); // optional
    table.string('freight_type', 50).nullable(); // LTL, FTL, Parcel
    table.text('custom_notes').nullable(); // Manual driver, contact
    table.date('shipped_date').nullable();
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now());
    table
      .uuid('delivery_method_id')
      .references('id')
      .inTable('delivery_methods');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
  });
  
  await knex.raw(`
    ALTER TABLE tracking_numbers
    ADD CONSTRAINT check_tracking_number_generic_format
    CHECK (
      tracking_number ~* '^[A-Z0-9\\-]{8,30}$' OR tracking_number IS NULL
    );
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tracking_numbers');
};
