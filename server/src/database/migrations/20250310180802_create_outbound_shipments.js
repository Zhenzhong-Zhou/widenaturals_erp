/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('outbound_shipments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table.uuid('order_id').notNullable().references('id').inTable('orders');
    table
      .uuid('warehouse_id')
      .notNullable()
      .references('id')
      .inTable('warehouses');

    table
      .uuid('delivery_method_id')
      .references('id')
      .inTable('delivery_methods');
    table
      .uuid('tracking_number_id')
      .references('id')
      .inTable('tracking_numbers');

    table
      .uuid('status_id')
      .notNullable()
      .references('id')
      .inTable('shipment_status');

    table.date('shipped_at').nullable();
    table.date('expected_delivery_date').nullable();

    table.text('notes').nullable();
    table.jsonb('shipment_details').nullable(); // Stores carrier details, special instructions

    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    table.unique(['order_id', 'warehouse_id'],
      { indexName: 'outbound_shipments_order_id_warehouse_id_unique' });
    
    // Performance Optimization
    table.index(['order_id', 'warehouse_id', 'tracking_number_id']);
    table.index('status_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('outbound_shipments');
};
