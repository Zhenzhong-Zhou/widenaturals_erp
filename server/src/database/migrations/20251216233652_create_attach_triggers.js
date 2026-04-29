/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.up = function (knex) {
  return knex.raw(`

    -- =============================================
    -- DEFAULT STATUS TRIGGERS (INSERT)
    -- Only for tables with status_id → status table
    -- =============================================

    CREATE TRIGGER set_roles_default_status_id
    BEFORE INSERT ON roles
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_users_default_status_id
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_permissions_default_status_id
    BEFORE INSERT ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_role_permissions_default_status_id
    BEFORE INSERT ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_audit_action_types_default_status_id
    BEFORE INSERT ON audit_action_types
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_bom_item_materials_default_status_id
    BEFORE INSERT ON bom_item_materials
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_boms_default_status_id
    BEFORE INSERT ON boms
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_compliance_records_default_status_id
    BEFORE INSERT ON compliance_records
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_customers_default_status_id
    BEFORE INSERT ON customers
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_delivery_methods_default_status_id
    BEFORE INSERT ON delivery_methods
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_discounts_default_status_id
    BEFORE INSERT ON discounts
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_inventory_action_types_default_status_id
    BEFORE INSERT ON inventory_action_types
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_location_types_default_status_id
    BEFORE INSERT ON location_types
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_locations_default_status_id
    BEFORE INSERT ON locations
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_manufacturers_default_status_id
    BEFORE INSERT ON manufacturers
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_order_status_default_status_id
    BEFORE INSERT ON order_status
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_order_types_default_status_id
    BEFORE INSERT ON order_types
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_packaging_materials_default_status_id
    BEFORE INSERT ON packaging_materials
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_pricing_groups_default_status_id
    BEFORE INSERT ON pricing_groups
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_pricing_types_default_status_id
    BEFORE INSERT ON pricing_types
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_products_default_status_id
    BEFORE INSERT ON products
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_return_items_default_status_id
    BEFORE INSERT ON return_items
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_returns_default_status_id
    BEFORE INSERT ON returns
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_sku_code_bases_default_status_id
    BEFORE INSERT ON sku_code_bases
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_skus_default_status_id
    BEFORE INSERT ON skus
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_suppliers_default_status_id
    BEFORE INSERT ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_tracking_numbers_default_status_id
    BEFORE INSERT ON tracking_numbers
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_warehouses_default_status_id
    BEFORE INSERT ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();
    
    CREATE TRIGGER set_user_warehouse_assignments_updated_at
    BEFORE UPDATE ON user_warehouse_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


    -- =============================================
    -- UPDATED_AT TRIGGERS (UPDATE)
    -- =============================================

    -- === STATUS SETUP ===
    CREATE TRIGGER set_status_updated_at
    BEFORE UPDATE ON status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === ROLES & AUTH ===
    CREATE TRIGGER set_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_permissions_updated_at
    BEFORE UPDATE ON permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_role_permissions_updated_at
    BEFORE UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === ENTITY SETUP ===

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

    CREATE TRIGGER set_pricing_groups_updated_at
    BEFORE UPDATE ON pricing_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_compliance_records_updated_at
    BEFORE UPDATE ON compliance_records
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

    CREATE TRIGGER set_audit_action_types_updated_at
    BEFORE UPDATE ON audit_action_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === ADDRESSES ===
    CREATE TRIGGER set_addresses_updated_at
    BEFORE UPDATE ON addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === PRODUCT & SKU ===
    CREATE TRIGGER set_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_skus_updated_at
    BEFORE UPDATE ON skus
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_sku_code_bases_updated_at
    BEFORE UPDATE ON sku_code_bases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === BOM ===
    CREATE TRIGGER set_boms_updated_at
    BEFORE UPDATE ON boms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_bom_items_updated_at
    BEFORE UPDATE ON bom_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_bom_item_materials_updated_at
    BEFORE UPDATE ON bom_item_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === SUPPLY CHAIN ===
    CREATE TRIGGER set_manufacturers_updated_at
    BEFORE UPDATE ON manufacturers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_suppliers_updated_at
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_parts_updated_at
    BEFORE UPDATE ON parts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_part_materials_updated_at
    BEFORE UPDATE ON part_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_packaging_materials_updated_at
    BEFORE UPDATE ON packaging_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_packaging_material_suppliers_updated_at
    BEFORE UPDATE ON packaging_material_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === BATCHES ===
    CREATE TRIGGER set_batch_registry_updated_at
    BEFORE UPDATE ON batch_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_batch_status_updated_at
    BEFORE UPDATE ON batch_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_batch_activity_types_updated_at
    BEFORE UPDATE ON batch_activity_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_product_batches_updated_at
    BEFORE UPDATE ON product_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_packaging_material_batches_updated_at
    BEFORE UPDATE ON packaging_material_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === WAREHOUSE & INVENTORY ===
    CREATE TRIGGER set_warehouse_types_updated_at
    BEFORE UPDATE ON warehouse_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_warehouses_updated_at
    BEFORE UPDATE ON warehouses
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

    CREATE TRIGGER set_lot_adjustment_types_updated_at
    BEFORE UPDATE ON lot_adjustment_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === INVENTORY TRANSFERS & ALLOCATIONS ===
    CREATE TRIGGER set_inventory_transfer_status_updated_at
    BEFORE UPDATE ON inventory_transfer_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_inventory_transfers_updated_at
    BEFORE UPDATE ON inventory_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_inventory_allocation_status_updated_at
    BEFORE UPDATE ON inventory_allocation_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_inventory_allocations_updated_at
    BEFORE UPDATE ON inventory_allocations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_transfer_order_item_status_updated_at
    BEFORE UPDATE ON transfer_order_item_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_transfer_order_items_updated_at
    BEFORE UPDATE ON transfer_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === CUSTOMERS & ORDERS ===
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

    -- === PAYMENT ===
    CREATE TRIGGER set_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_payment_status_updated_at
    BEFORE UPDATE ON payment_status
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- === FULFILLMENT & SHIPMENTS ===
    CREATE TRIGGER set_fulfillment_status_updated_at
    BEFORE UPDATE ON fulfillment_status
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

    -- === RETURNS ===
    CREATE TRIGGER set_returns_updated_at
    BEFORE UPDATE ON returns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    CREATE TRIGGER set_return_items_updated_at
    BEFORE UPDATE ON return_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

    -- =============================================
    -- STATUS DATE TRIGGERS (UPDATE)
    -- For all tables with status_id + status_date
    -- =============================================

    CREATE TRIGGER trg_audit_action_types_status_date
    BEFORE UPDATE ON audit_action_types
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_bom_item_materials_status_date
    BEFORE UPDATE ON bom_item_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_boms_status_date
    BEFORE UPDATE ON boms
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_compliance_records_status_date
    BEFORE UPDATE ON compliance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_customers_status_date
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_delivery_methods_status_date
    BEFORE UPDATE ON delivery_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_discounts_status_date
    BEFORE UPDATE ON discounts
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_inventory_action_types_status_date
    BEFORE UPDATE ON inventory_action_types
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_location_types_status_date
    BEFORE UPDATE ON location_types
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_locations_status_date
    BEFORE UPDATE ON locations
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_manufacturers_status_date
    BEFORE UPDATE ON manufacturers
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_order_items_status_date
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_order_status_status_date
    BEFORE UPDATE ON order_status
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_order_types_status_date
    BEFORE UPDATE ON order_types
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_packaging_materials_status_date
    BEFORE UPDATE ON packaging_materials
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_pricing_groups_status_date
    BEFORE UPDATE ON pricing_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_pricing_types_status_date
    BEFORE UPDATE ON pricing_types
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_product_batches_status_date
    BEFORE UPDATE ON product_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_packaging_material_batches_status_date
    BEFORE UPDATE ON packaging_material_batches
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_products_status_date
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_return_items_status_date
    BEFORE UPDATE ON return_items
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_returns_status_date
    BEFORE UPDATE ON returns
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_role_permissions_status_date
    BEFORE UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_roles_status_date
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_sku_code_bases_status_date
    BEFORE UPDATE ON sku_code_bases
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_skus_status_date
    BEFORE UPDATE ON skus
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_suppliers_status_date
    BEFORE UPDATE ON suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_tracking_numbers_status_date
    BEFORE UPDATE ON tracking_numbers
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_users_status_date
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_warehouse_inventory_status_date
    BEFORE UPDATE ON warehouse_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();

    CREATE TRIGGER trg_warehouses_status_date
    BEFORE UPDATE ON warehouses
    FOR EACH ROW
    EXECUTE FUNCTION update_status_date_if_changed();
    
    CREATE TRIGGER set_inventory_allocations_default_status_id
    BEFORE INSERT ON inventory_allocations
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_inventory_transfers_default_status_id
    BEFORE INSERT ON inventory_transfers
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_order_fulfillments_default_status_id
    BEFORE INSERT ON order_fulfillments
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_order_items_default_status_id
    BEFORE INSERT ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_outbound_shipments_default_status_id
    BEFORE INSERT ON outbound_shipments
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_packaging_material_batches_default_status_id
    BEFORE INSERT ON packaging_material_batches
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_product_batches_default_status_id
    BEFORE INSERT ON product_batches
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_transfer_order_items_default_status_id
    BEFORE INSERT ON transfer_order_items
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();

    CREATE TRIGGER set_warehouse_inventory_default_status_id
    BEFORE INSERT ON warehouse_inventory
    FOR EACH ROW
    EXECUTE FUNCTION set_default_status_id();
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns {Promise<void>}
 */
exports.down = function (knex) {
  return knex.raw(`
    -- === DEFAULT STATUS TRIGGERS ===
    DROP TRIGGER IF EXISTS set_roles_default_status_id ON roles;
    DROP TRIGGER IF EXISTS set_users_default_status_id ON users;
    DROP TRIGGER IF EXISTS set_permissions_default_status_id ON permissions;
    DROP TRIGGER IF EXISTS set_role_permissions_default_status_id ON role_permissions;
    DROP TRIGGER IF EXISTS set_audit_action_types_default_status_id ON audit_action_types;
    DROP TRIGGER IF EXISTS set_bom_item_materials_default_status_id ON bom_item_materials;
    DROP TRIGGER IF EXISTS set_boms_default_status_id ON boms;
    DROP TRIGGER IF EXISTS set_compliance_records_default_status_id ON compliance_records;
    DROP TRIGGER IF EXISTS set_customers_default_status_id ON customers;
    DROP TRIGGER IF EXISTS set_delivery_methods_default_status_id ON delivery_methods;
    DROP TRIGGER IF EXISTS set_discounts_default_status_id ON discounts;
    DROP TRIGGER IF EXISTS set_inventory_action_types_default_status_id ON inventory_action_types;
    DROP TRIGGER IF EXISTS set_location_types_default_status_id ON location_types;
    DROP TRIGGER IF EXISTS set_locations_default_status_id ON locations;
    DROP TRIGGER IF EXISTS set_manufacturers_default_status_id ON manufacturers;
    DROP TRIGGER IF EXISTS set_order_status_default_status_id ON order_status;
    DROP TRIGGER IF EXISTS set_order_types_default_status_id ON order_types;
    DROP TRIGGER IF EXISTS set_packaging_materials_default_status_id ON packaging_materials;
    DROP TRIGGER IF EXISTS set_pricing_groups_default_status_id ON pricing_groups;
    DROP TRIGGER IF EXISTS set_pricing_types_default_status_id ON pricing_types;
    DROP TRIGGER IF EXISTS set_products_default_status_id ON products;
    DROP TRIGGER IF EXISTS set_return_items_default_status_id ON return_items;
    DROP TRIGGER IF EXISTS set_returns_default_status_id ON returns;
    DROP TRIGGER IF EXISTS set_sku_code_bases_default_status_id ON sku_code_bases;
    DROP TRIGGER IF EXISTS set_skus_default_status_id ON skus;
    DROP TRIGGER IF EXISTS set_suppliers_default_status_id ON suppliers;
    DROP TRIGGER IF EXISTS set_tracking_numbers_default_status_id ON tracking_numbers;
    DROP TRIGGER IF EXISTS set_warehouses_default_status_id ON warehouses;

    -- === UPDATED_AT TRIGGERS ===
    DROP TRIGGER IF EXISTS set_status_updated_at ON status;
    DROP TRIGGER IF EXISTS set_roles_updated_at ON roles;
    DROP TRIGGER IF EXISTS set_users_updated_at ON users;
    DROP TRIGGER IF EXISTS set_permissions_updated_at ON permissions;
    DROP TRIGGER IF EXISTS set_role_permissions_updated_at ON role_permissions;
    DROP TRIGGER IF EXISTS set_location_types_updated_at ON location_types;
    DROP TRIGGER IF EXISTS set_locations_updated_at ON locations;
    DROP TRIGGER IF EXISTS set_pricing_types_updated_at ON pricing_types;
    DROP TRIGGER IF EXISTS set_pricing_groups_updated_at ON pricing_groups;
    DROP TRIGGER IF EXISTS set_compliance_records_updated_at ON compliance_records;
    DROP TRIGGER IF EXISTS set_delivery_methods_updated_at ON delivery_methods;
    DROP TRIGGER IF EXISTS set_order_types_updated_at ON order_types;
    DROP TRIGGER IF EXISTS set_order_status_updated_at ON order_status;
    DROP TRIGGER IF EXISTS set_tracking_numbers_updated_at ON tracking_numbers;
    DROP TRIGGER IF EXISTS set_tax_rates_updated_at ON tax_rates;
    DROP TRIGGER IF EXISTS set_discount_updated_at ON discounts;
    DROP TRIGGER IF EXISTS set_audit_action_types_updated_at ON audit_action_types;
    DROP TRIGGER IF EXISTS set_addresses_updated_at ON addresses;
    DROP TRIGGER IF EXISTS set_products_updated_at ON products;
    DROP TRIGGER IF EXISTS set_skus_updated_at ON skus;
    DROP TRIGGER IF EXISTS set_sku_code_bases_updated_at ON sku_code_bases;
    DROP TRIGGER IF EXISTS set_boms_updated_at ON boms;
    DROP TRIGGER IF EXISTS set_bom_items_updated_at ON bom_items;
    DROP TRIGGER IF EXISTS set_bom_item_materials_updated_at ON bom_item_materials;
    DROP TRIGGER IF EXISTS set_manufacturers_updated_at ON manufacturers;
    DROP TRIGGER IF EXISTS set_suppliers_updated_at ON suppliers;
    DROP TRIGGER IF EXISTS set_parts_updated_at ON parts;
    DROP TRIGGER IF EXISTS set_part_materials_updated_at ON part_materials;
    DROP TRIGGER IF EXISTS set_packaging_materials_updated_at ON packaging_materials;
    DROP TRIGGER IF EXISTS set_packaging_material_suppliers_updated_at ON packaging_material_suppliers;
    DROP TRIGGER IF EXISTS set_batch_registry_updated_at ON batch_registry;
    DROP TRIGGER IF EXISTS set_batch_status_updated_at ON batch_status;
    DROP TRIGGER IF EXISTS set_batch_activity_types_updated_at ON batch_activity_types;
    DROP TRIGGER IF EXISTS set_product_batches_updated_at ON product_batches;
    DROP TRIGGER IF EXISTS set_packaging_material_batches_updated_at ON packaging_material_batches;
    DROP TRIGGER IF EXISTS set_warehouse_types_updated_at ON warehouse_types;
    DROP TRIGGER IF EXISTS set_warehouses_updated_at ON warehouses;
    DROP TRIGGER IF EXISTS set_warehouse_inventory_updated_at ON warehouse_inventory;
    DROP TRIGGER IF EXISTS set_warehouse_zones_updated_at ON warehouse_zones;
    DROP TRIGGER IF EXISTS set_inventory_status_updated_at ON inventory_status;
    DROP TRIGGER IF EXISTS set_inventory_action_types_updated_at ON inventory_action_types;
    DROP TRIGGER IF EXISTS set_lot_adjustment_types_updated_at ON lot_adjustment_types;
    DROP TRIGGER IF EXISTS set_inventory_transfer_status_updated_at ON inventory_transfer_status;
    DROP TRIGGER IF EXISTS set_inventory_transfers_updated_at ON inventory_transfers;
    DROP TRIGGER IF EXISTS set_inventory_allocation_status_updated_at ON inventory_allocation_status;
    DROP TRIGGER IF EXISTS set_inventory_allocations_updated_at ON inventory_allocations;
    DROP TRIGGER IF EXISTS set_transfer_order_item_status_updated_at ON transfer_order_item_status;
    DROP TRIGGER IF EXISTS set_transfer_order_items_updated_at ON transfer_order_items;
    DROP TRIGGER IF EXISTS set_customers_updated_at ON customers;
    DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
    DROP TRIGGER IF EXISTS set_order_items_updated_at ON order_items;
    DROP TRIGGER IF EXISTS set_sales_orders_updated_at ON sales_orders;
    DROP TRIGGER IF EXISTS set_payment_methods_updated_at ON payment_methods;
    DROP TRIGGER IF EXISTS set_payment_status_updated_at ON payment_status;
    DROP TRIGGER IF EXISTS set_fulfillment_status_updated_at ON fulfillment_status;
    DROP TRIGGER IF EXISTS set_order_fulfillments_updated_at ON order_fulfillments;
    DROP TRIGGER IF EXISTS set_outbound_shipments_updated_at ON outbound_shipments;
    DROP TRIGGER IF EXISTS set_shipment_status_updated_at ON shipment_status;
    DROP TRIGGER IF EXISTS set_returns_updated_at ON returns;
    DROP TRIGGER IF EXISTS set_return_items_updated_at ON return_items;
    DROP TRIGGER IF EXISTS set_user_warehouse_assignments_updated_at ON user_warehouse_assignments;

    -- === STATUS DATE TRIGGERS ===
    DROP TRIGGER IF EXISTS trg_audit_action_types_status_date ON audit_action_types;
    DROP TRIGGER IF EXISTS trg_bom_item_materials_status_date ON bom_item_materials;
    DROP TRIGGER IF EXISTS trg_boms_status_date ON boms;
    DROP TRIGGER IF EXISTS trg_compliance_records_status_date ON compliance_records;
    DROP TRIGGER IF EXISTS trg_customers_status_date ON customers;
    DROP TRIGGER IF EXISTS trg_delivery_methods_status_date ON delivery_methods;
    DROP TRIGGER IF EXISTS trg_discounts_status_date ON discounts;
    DROP TRIGGER IF EXISTS trg_inventory_action_types_status_date ON inventory_action_types;
    DROP TRIGGER IF EXISTS trg_location_types_status_date ON location_types;
    DROP TRIGGER IF EXISTS trg_locations_status_date ON locations;
    DROP TRIGGER IF EXISTS trg_manufacturers_status_date ON manufacturers;
    DROP TRIGGER IF EXISTS trg_order_items_status_date ON order_items;
    DROP TRIGGER IF EXISTS trg_order_status_status_date ON order_status;
    DROP TRIGGER IF EXISTS trg_order_types_status_date ON order_types;
    DROP TRIGGER IF EXISTS trg_packaging_materials_status_date ON packaging_materials;
    DROP TRIGGER IF EXISTS trg_pricing_groups_status_date ON pricing_groups;
    DROP TRIGGER IF EXISTS trg_pricing_types_status_date ON pricing_types;
    DROP TRIGGER IF EXISTS trg_product_batches_status_date ON product_batches;
    DROP TRIGGER IF EXISTS trg_packaging_material_batches_status_date ON packaging_material_batches;
    DROP TRIGGER IF EXISTS trg_products_status_date ON products;
    DROP TRIGGER IF EXISTS trg_return_items_status_date ON return_items;
    DROP TRIGGER IF EXISTS trg_returns_status_date ON returns;
    DROP TRIGGER IF EXISTS trg_role_permissions_status_date ON role_permissions;
    DROP TRIGGER IF EXISTS trg_roles_status_date ON roles;
    DROP TRIGGER IF EXISTS trg_sku_code_bases_status_date ON sku_code_bases;
    DROP TRIGGER IF EXISTS trg_skus_status_date ON skus;
    DROP TRIGGER IF EXISTS trg_suppliers_status_date ON suppliers;
    DROP TRIGGER IF EXISTS trg_tracking_numbers_status_date ON tracking_numbers;
    DROP TRIGGER IF EXISTS trg_users_status_date ON users;
    DROP TRIGGER IF EXISTS trg_warehouses_status_date ON warehouses;
    DROP TRIGGER IF EXISTS trg_warehouse_inventory_status_date ON warehouse_inventory;
    DROP TRIGGER IF EXISTS set_inventory_allocations_default_status_id ON inventory_allocations;
    DROP TRIGGER IF EXISTS set_inventory_transfers_default_status_id ON inventory_transfers;
    DROP TRIGGER IF EXISTS set_order_fulfillments_default_status_id ON order_fulfillments;
    DROP TRIGGER IF EXISTS set_order_items_default_status_id ON order_items;
    DROP TRIGGER IF EXISTS set_outbound_shipments_default_status_id ON outbound_shipments;
    DROP TRIGGER IF EXISTS set_packaging_material_batches_default_status_id ON packaging_material_batches;
    DROP TRIGGER IF EXISTS set_product_batches_default_status_id ON product_batches;
    DROP TRIGGER IF EXISTS set_transfer_order_items_default_status_id ON transfer_order_items;
    DROP TRIGGER IF EXISTS set_warehouse_inventory_default_status_id ON warehouse_inventory;
  `);
};
