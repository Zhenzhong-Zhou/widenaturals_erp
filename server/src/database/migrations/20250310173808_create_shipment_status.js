/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("shipment_status", (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.string("name", 50).unique().notNullable(); // "Pending", "Shipped", "Delivered"
    table.string("code", 20).unique().notNullable(); // "SHIPMENT_PENDING", "SHIPMENT_SHIPPED"
    table.text('description').nullable();
    table.boolean("is_final").defaultTo(false); // Marks final states like Delivered/Canceled
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.uuid("created_by").references("id").inTable("users");
    table.uuid("updated_by").references("id").inTable("users");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists("shipment_status");
};
