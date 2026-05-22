/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('tracking_numbers', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.uuid('outbound_shipment_id').notNullable()
      .references('id').inTable('outbound_shipments');
    
    table.string('tracking_number', 255).nullable();
    table.string('carrier', 100).notNullable();
    table.string('service_name', 100).nullable();
    table.string('bol_number', 100).nullable();
    table.string('freight_type', 50).nullable(); // LTL, FTL, Parcel
    table.text('custom_notes').nullable();
    table.date('shipped_date').nullable();
    
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.unique(['carrier', 'tracking_number'], {
      indexName: 'tracking_numbers_carrier_tracking_number_unique',
    });
    
    table.index('outbound_shipment_id');
    table.index('tracking_number');
  });
  
  await knex.raw(`
    ALTER TABLE tracking_numbers
    ADD CONSTRAINT check_tracking_number_generic_format
    CHECK (tracking_number ~ '^[A-Z0-9\\-]{8,30}$' OR tracking_number IS NULL)
  `);
  
  await knex.raw(`
    ALTER TABLE tracking_numbers
    ADD CONSTRAINT check_freight_type
    CHECK (
      freight_type IN ('PARCEL', 'LTL', 'FTL', 'AIR', 'OCEAN', 'COURIER')
      OR freight_type IS NULL);
  `);
};
/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('tracking_numbers');
};
