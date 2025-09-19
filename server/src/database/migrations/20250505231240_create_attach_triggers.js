/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.Raw<TResult>}
 */
exports.up = function (knex) {
  return knex.raw(`
  
    -- === STATUS SETUP ===
    CREATE TRIGGER set_status_updated_at
    BEFORE UPDATE ON status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === ROLES ===
    CREATE TRIGGER set_roles_default_status_id
    BEFORE INSERT ON roles
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === USERS ===
    CREATE TRIGGER set_users_default_status_id
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === PERMISSIONS ===
    CREATE TRIGGER set_permissions_default_status_id
    BEFORE INSERT ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === ROLE PERMISSIONS ===
    CREATE TRIGGER set_role_permissions_default_status_id
    BEFORE INSERT ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_role_permissions_updated_at
    BEFORE UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === ENTITY SETUP ===
    CREATE TRIGGER set_entity_types_updated_at
    BEFORE UPDATE ON entity_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_location_types_updated_at
    BEFORE UPDATE ON location_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_locations_updated_at
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_pricing_types_updated_at
    BEFORE UPDATE ON pricing_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_compliances_updated_at
    BEFORE UPDATE ON compliances
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_delivery_methods_updated_at
    BEFORE UPDATE ON delivery_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_order_types_updated_at
    BEFORE UPDATE ON order_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_order_status_updated_at
    BEFORE UPDATE ON order_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_tracking_numbers_updated_at
    BEFORE UPDATE ON tracking_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_tax_rates_updated_at
    BEFORE UPDATE ON tax_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_discount_updated_at
    BEFORE UPDATE ON discounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === PRODUCT & INVENTORY ===
    CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_warehouses_updated_at
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_location_inventory_updated_at
    BEFORE UPDATE ON location_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_warehouse_inventory_updated_at
    BEFORE UPDATE ON warehouse_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_warehouse_zones_updated_at
    BEFORE UPDATE ON warehouse_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_inventory_status_updated_at
    BEFORE UPDATE ON inventory_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_inventory_action_types_updated_at
    BEFORE UPDATE ON inventory_action_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_inventory_transfer_status_updated_at
    BEFORE UPDATE ON inventory_transfer_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_inventory_transfers_updated_at
    BEFORE UPDATE ON inventory_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_inventory_allocations_updated_at
    BEFORE UPDATE ON inventory_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_inventory_allocation_status_updated_at
    BEFORE UPDATE ON inventory_allocation_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_lot_adjustment_types_updated_at
    BEFORE UPDATE ON lot_adjustment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === ORDERS ===
    CREATE TRIGGER set_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_order_items_updated_at
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_sales_orders_updated_at
    BEFORE UPDATE ON sales_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_returns_updated_at
    BEFORE UPDATE ON returns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_return_items_updated_at
    BEFORE UPDATE ON return_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_order_fulfillments_updated_at
    BEFORE UPDATE ON order_fulfillments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_outbound_shipments_updated_at
    BEFORE UPDATE ON outbound_shipments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_shipment_status_updated_at
    BEFORE UPDATE ON shipment_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Knex.Raw<TResult>}
 */
// todo: update this for all reltive table it may be the last file always?
exports.down = function (knex) {
  return knex.raw(`
    -- Drop all update triggers
    DROP TRIGGER IF EXISTS set_status_updated_at ON status;

    DROP TRIGGER IF EXISTS set_roles_default_status_id ON roles;
    DROP TRIGGER IF EXISTS set_roles_updated_at ON roles;

    DROP TRIGGER IF EXISTS set_users_default_status_id ON users;
    DROP TRIGGER IF EXISTS set_users_updated_at ON users;

    DROP TRIGGER IF EXISTS set_permissions_default_status_id ON permissions;
    DROP TRIGGER IF EXISTS set_permissions_updated_at ON permissions;

    DROP TRIGGER IF EXISTS set_role_permissions_default_status_id ON role_permissions;
    DROP TRIGGER IF EXISTS set_role_permissions_updated_at ON role_permissions;

    DROP TRIGGER IF EXISTS set_entity_types_updated_at ON entity_types;
    DROP TRIGGER IF EXISTS set_location_types_updated_at ON location_types;
    DROP TRIGGER IF EXISTS set_locations_updated_at ON locations;
    DROP TRIGGER IF EXISTS set_pricing_types_updated_at ON pricing_types;
    DROP TRIGGER IF EXISTS set_compliances_updated_at ON compliances;
    DROP TRIGGER IF EXISTS set_delivery_methods_updated_at ON delivery_methods;
    DROP TRIGGER IF EXISTS set_order_types_updated_at ON order_types;
    DROP TRIGGER IF EXISTS set_order_status_updated_at ON order_status;
    DROP TRIGGER IF EXISTS set_tracking_numbers_updated_at ON tracking_numbers;
    DROP TRIGGER IF EXISTS set_tax_rates_updated_at ON tax_rates;
    DROP TRIGGER IF EXISTS set_discount_updated_at ON discounts;

    DROP TRIGGER IF EXISTS set_products_updated_at ON products;
    DROP TRIGGER IF EXISTS set_warehouses_updated_at ON warehouses;
    DROP TRIGGER IF EXISTS set_inventory_updated_at ON inventory;
    DROP TRIGGER IF EXISTS set_warehouse_inventory_updated_at ON warehouse_inventory;
    DROP TRIGGER IF EXISTS set_warehouse_lot_status_updated_at ON warehouse_lot_status;
    DROP TRIGGER IF EXISTS set_inventory_action_types_updated_at ON inventory_action_types;
    DROP TRIGGER IF EXISTS set_inventory_transfer_status_updated_at ON inventory_transfer_status;
    DROP TRIGGER IF EXISTS set_inventory_transfers_updated_at ON inventory_transfers;
    DROP TRIGGER IF EXISTS set_inventory_allocations_updated_at ON inventory_allocations;
    DROP TRIGGER IF EXISTS set_inventory_allocation_status_updated_at ON inventory_allocation_status;
    DROP TRIGGER IF EXISTS set_lot_adjustment_types_updated_at ON lot_adjustment_types;
    DROP TRIGGER IF EXISTS set_warehouse_lot_adjustments_updated_at ON warehouse_lot_adjustments;
    DROP TRIGGER IF EXISTS set_inventory_activity_log_updated_at ON inventory_activity_log;

    DROP TRIGGER IF EXISTS set_customers_updated_at ON customers;
    DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
    DROP TRIGGER IF EXISTS set_order_items_updated_at ON order_items;
    DROP TRIGGER IF EXISTS set_sales_orders_updated_at ON sales_orders;
    DROP TRIGGER IF EXISTS set_returns_updated_at ON returns;
    DROP TRIGGER IF EXISTS set_return_items_updated_at ON return_items;
    DROP TRIGGER IF EXISTS set_order_fulfillments_updated_at ON order_fulfillments;
    DROP TRIGGER IF EXISTS set_outbound_shipments_updated_at ON outbound_shipments;
    DROP TRIGGER IF EXISTS set_shipment_status_updated_at ON shipment_status;
  `);
};
