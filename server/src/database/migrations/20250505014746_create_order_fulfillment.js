/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('order_fulfillment', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));

    table
      .uuid('order_item_id')
      .notNullable()
      .references('id')
      .inTable('order_items');

    table
      .uuid('allocation_id')
      .references('id')
      .inTable('inventory_allocations')
      .nullable();

    table.integer('quantity_shipped').notNullable().checkPositive();

    table
      .uuid('status_id')
      .references('id')
      .inTable('fulfillment_status')
      .nullable();

    table
      .uuid('shipment_id')
      .notNullable()
      .references('id')
      .inTable('outbound_shipments');

    table.timestamp('shipped_at').defaultTo(knex.fn.now());

    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.uuid('fulfilled_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');

    table.unique(['order_item_id', 'shipment_id'], {
      indexName: 'uniq_order_item_shipment',
    });
  });

  await knex.raw(`
    ALTER TABLE order_fulfillment
    ADD CONSTRAINT check_quantity_non_negative
    CHECK (quantity_shipped >= 0);
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('order_fulfillment');
};
