/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.createTable("inventory_transfers", (table) => {
    table.uuid("id").primary().defaultTo(knex.raw("uuid_generate_v4()"));
    
    table.uuid("from_warehouse_id").notNullable().references("id").inTable("warehouses");
    table.uuid("to_warehouse_id").notNullable().references("id").inTable("warehouses");
    table.uuid("lot_id").references("id").inTable("warehouse_inventory_lots").nullable();
    
    table.integer("quantity").notNullable().checkPositive();
    
    table.uuid("status_id").notNullable().references("id").inTable("inventory_transfer_status"); // ✅ Normalized status
    
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
    table.uuid("created_by").references("id").inTable("users");
    table.uuid("updated_by").references("id").inTable("users");
    
    // 🔹 Performance Optimization
    table.index(["from_warehouse_id", "to_warehouse_id"]);
    table.index("status_id");
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists("inventory_transfers");
};
