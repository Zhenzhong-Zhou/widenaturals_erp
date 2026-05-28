/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = async function (knex) {
  await knex.schema.createTable('outbound_shipments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    
    table.uuid('order_id').notNullable().references('id').inTable('orders');
    table.uuid('warehouse_id').notNullable().references('id').inTable('warehouses');
    table.uuid('delivery_method_id').notNullable().references('id').inTable('delivery_methods');
    table.uuid('status_id').notNullable().references('id').inTable('shipment_status');
    
    table.timestamp('shipped_at', { useTz: true }).nullable();
    table.date('expected_delivery_date').nullable();
    
    table.timestamp('delivered_at', { useTz: true }).nullable();
    
    table.text('notes').nullable();
    table.jsonb('shipment_details').nullable(); // Stores carrier details, special instructions
    
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    table.timestamp('created_at', { useTz: true }).defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).defaultTo(knex.fn.now());

    table.unique(['order_id', 'warehouse_id'], {
      indexName: 'outbound_shipments_order_id_warehouse_id_unique',
    });

    // Performance Optimization
    table.index('order_id');
    table.index('warehouse_id');
    table.index('status_id');
    table.index('delivery_method_id');
  });
  
  await knex.raw(`
    ALTER TABLE outbound_shipments
    ADD CONSTRAINT check_delivered_after_shipped
    CHECK (
      delivered_at IS NULL
      OR shipped_at IS NULL
      OR delivered_at >= shipped_at
    )
  `);
  
  await knex.raw(`
    CREATE INDEX outbound_shipments_shipped_at_index
    ON outbound_shipments (shipped_at)
    WHERE shipped_at IS NOT NULL
  `);
  
  await knex.raw(`
    CREATE INDEX outbound_shipments_delivered_at_index
    ON outbound_shipments (delivered_at)
    WHERE delivered_at IS NOT NULL
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = async function (knex) {
  await knex.schema.dropTableIfExists('outbound_shipments');
};
