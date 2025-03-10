/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable('order_status', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string('name', 50).unique().notNullable(); // e.g., "pending", "shipped"
    table.string('category', 50).notNullable().checkIn([
      'processing', 'shipment', 'payment', 'return', 'completion'
    ]); // High-level category of status
    table.string('code', 50).unique().notNullable(); // Short code, e.g., "ORDER_PENDING"
    table.text('description').nullable();
    table.boolean('is_final').defaultTo(false); // Marks if status is terminal (e.g., delivered, canceled)
    table.uuid('status_id').notNullable().references('id').inTable('status');
    table.timestamp('status_date', { useTz: true }).defaultTo(knex.fn.now()); // Auto-set on creation in UTC
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.uuid('created_by').references('id').inTable('users');
    table.uuid('updated_by').references('id').inTable('users');
    
    table.unique(['name', 'code']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists('order_status');
};
