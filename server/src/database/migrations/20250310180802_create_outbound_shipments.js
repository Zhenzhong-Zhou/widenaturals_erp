/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.up = function (knex) {
  return knex.schema.createTable("outbound_shipments", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    
    table.uuid("order_id").notNullable().references("id").inTable("sales_orders");
    table.uuid("warehouse_id").notNullable().references("id").inTable("warehouses");
    
    table.uuid("delivery_method_id").references("id").inTable("delivery_methods");
    table.uuid("tracking_number_id").references("id").inTable("tracking_numbers");
    
    table.uuid("status_id").notNullable().references("id").inTable("shipment_status"); // ✅ Normalized status
    
    table.date("shipment_date").nullable();
    table.date("expected_delivery_date").nullable();
    
    table.text("notes").nullable();
    table.jsonb("shipment_details").nullable(); // Stores carrier details, special instructions
    
    table.uuid("created_by").references("id").inTable("users");
    table.uuid("updated_by").references("id").inTable("users");
    
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    
    // 🔹 Performance Optimization
    table.index(["order_id", "warehouse_id", "tracking_number_id"]);
    table.index("status_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.SchemaBuilder}
 */
exports.down = function (knex) {
  return knex.schema.dropTableIfExists("outbound_shipments");
};
