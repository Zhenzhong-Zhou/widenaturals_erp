const { fetchDynamicValue } = require('../03_utils');
const {
  ORDER_CATEGORIES,
  GENERIC_ORDER_PERMISSIONS,
} = require('../../../utils/constants/domain/order-type-constants');

exports.seed = async function (knex) {
  const [{ count }] = await knex('permissions').count('id');

  if (parseInt(count, 10) > 0) {
    console.log('Skipping permissions seed: data already exists.');
    return;
  }

  console.log(
    `[${new Date().toISOString()}] [SEED] Starting permission seeding...`
  );

  // Resolve system user (fail loudly if missing)
  const systemUserId = await fetchDynamicValue(
    knex,
    'users',
    'email',
    'system@internal.local',
    'id'
  );

  if (!systemUserId) {
    throw new Error(
      '[SEED][permissions] System user not found: system@internal.local'
    );
  }

  // Resolve active status (fail loudly if missing)
  const statusRow = await knex('status')
    .select('id')
    .where('name', 'active')
    .first();
  if (!statusRow?.id) {
    throw new Error(
      '[SEED][permissions] Status "active" not found in status table'
    );
  }
  const activeStatusId = statusRow.id;

  const baseFields = {
    status_id: activeStatusId,
    created_at: knex.fn.now(),
    created_by: systemUserId,
    updated_at: null,
    updated_by: null,
  };

  const permissions = [
    {
      name: 'View Self Profile',
      key: 'view_self_profile',
      description: 'Allows managing user accounts',
    },
    {
      name: 'Manage Users',
      key: 'manage_users',
      description: 'Allows managing user accounts',
    },
    {
      name: 'View Prices',
      key: 'view_prices',
      description: 'Allows viewing price details',
    },
    {
      name: 'Manage Prices',
      key: 'manage_prices',
      description: 'Allows updating price details',
    },
    {
      name: 'View Locations',
      key: 'view_locations',
      description: 'Allows viewing location details',
    },
    {
      name: 'Manage Locations',
      key: 'manage_locations',
      description: 'Allows updating location details',
    },
    {
      name: 'View Warehouses',
      key: 'view_warehouses',
      description: 'Allows viewing warehouse details',
    },
    {
      name: 'Manage Warehouses',
      key: 'manage_warehouses',
      description: 'Allows updating warehouse details',
    },
    {
      name: 'Root Access',
      key: 'root_access',
      description: 'Grants access to all routes and operations',
    },

    // Audit and Logs
    {
      name: 'View Address Audit',
      key: 'view_address_audit',
      description: 'Allows viewing address-related audit logs',
    },

    // Address & Customer
    {
      name: 'View Address Detail',
      key: 'view_address_detail',
      description: 'Allows viewing detailed address information',
    },
    {
      name: 'View Customer',
      key: 'view_customer',
      description: 'Allows viewing customer details',
    },
    {
      name: 'Create Customer',
      key: 'create_customer',
      description: 'Allows creating new customers',
    },
    {
      name: 'Create Address',
      key: 'create_address',
      description: 'Allows creating address records',
    },

    // Orders
    {
      name: 'Create Orders',
      key: 'create_orders',
      description: 'Allows creating orders (generic permission)',
    },
    {
      name: 'View Orders',
      key: 'view_orders',
      description: 'Allows viewing orders (generic permission)',
    },

    // Lookup Permissions (new/missing adjusted)
    {
      name: 'View Batch Registry Lookup',
      key: 'view_batch_registry_lookup',
      description: 'Allows accessing batch registry dropdown',
    },
    {
      name: 'View Warehouse Lookup',
      key: 'view_warehouse_lookup',
      description: 'Allows accessing warehouse lookup dropdown',
    },
    {
      name: 'View Lot Adjustment Type Lookup',
      key: 'view_lot_adjustment_type_lookup',
      description: 'Allows accessing lot adjustment type dropdown',
    },
    {
      name: 'View Customer Lookup',
      key: 'view_customer_lookup',
      description: 'Allows accessing customer lookup',
    },
    {
      name: 'View Customer Address Lookup',
      key: 'view_customer_address_lookup',
      description: 'Allows accessing customer address lookup',
    },
    {
      name: 'View Order Type Lookup',
      key: 'view_order_type_lookup',
      description: 'Allows viewing order type dropdown',
    },
    {
      name: 'View Payment Method Lookup',
      key: 'view_payment_method_lookup',
      description: 'Allows viewing payment method dropdown',
    },
    {
      name: 'View Discount Lookup',
      key: 'view_discount_lookup',
      description: 'Allows viewing discount options in dropdowns',
    },
    {
      name: 'View Tax Rate Lookup',
      key: 'view_tax_rate_lookup',
      description: 'Allows viewing tax rate options in dropdowns',
    },
    {
      name: 'View Delivery Method Lookup',
      key: 'view_delivery_method_lookup',
      description: 'Allows viewing delivery method options in dropdowns',
    },
    {
      name: 'View SKU Lookup',
      key: 'view_sku_lookup',
      description: 'Allows accessing SKU/product lookup dropdowns',
    },
    {
      name: 'View Pricing Lookup',
      key: 'view_pricing_lookup',
      description: 'Allows accessing pricing lookup dropdowns',
    },
    {
      name: 'View Packaging Material Lookup',
      key: 'view_packaging_material_lookup',
      description: 'Allows accessing packaging material lookup dropdowns',
    },

    // Pricing
    {
      name: 'View Pricing Types',
      key: 'view_pricing_types',
      description: 'Allows viewing pricing type data',
    },
    {
      name: 'View All Pricing Types',
      key: 'view_all_pricing_types',
      description: 'Allows viewing all available pricing types',
    },
    {
      name: 'View Pricing Config',
      key: 'view_pricing_config',
      description: 'Allows viewing pricing configuration settings',
    },
    {
      name: 'Manage Pricing',
      key: 'manage_pricing',
      description: 'Allows managing pricing configuration and rules',
    },
    {
      name: 'Export Pricing',
      key: 'export_pricing',
      description: 'Allows exporting pricing data',
    },

    // Catalog
    {
      name: 'Manage Catalog',
      key: 'manage_catalog',
      description: 'Allows managing catalog items and details',
    },

    // Inventory & System
    {
      name: 'View Inventory',
      key: 'view_inventory',
      description: 'Allows viewing inventory details',
    },
    {
      name: 'View Product Inventory',
      key: 'view_product_inventory',
      description: 'Allows viewing product-level inventory',
    },
    {
      name: 'View Material Inventory',
      key: 'view_material_inventory',
      description: 'Allows viewing raw material and packaging inventory',
    },
    {
      name: 'View Warehouse Inventory',
      key: 'view_warehouse_inventory',
      description: 'Allows viewing inventory by warehouse',
    },
    {
      name: 'View Inventory Summary',
      key: 'view_inventory_summary',
      description: 'Allows viewing aggregated inventory summaries',
    },
    {
      name: 'Manage Inventory',
      key: 'manage_inventory',
      description: 'Allows managing inventory records',
    },
    {
      name: 'Adjust Inventory',
      key: 'adjust_inventory',
      description: 'Allows making manual inventory adjustments',
    },
    {
      name: 'Manage Warehouse Inventory',
      key: 'manage_warehouse_inventory',
      description: 'Allows managing inventory inside warehouses',
    },
    {
      name: 'View Inventory Log',
      key: 'view_inventory_log',
      description: 'Allows viewing inventory log records',
    },

    // External and System
    {
      name: 'View External Data',
      key: 'view_external_data',
      description: 'Allows accessing external data for lot adjustment',
    },
    {
      name: 'View System',
      key: 'view_system',
      description: 'Allows viewing system-related data',
    },
    {
      name: 'View System Status',
      key: 'view_system_status',
      description: 'Allows viewing system health and uptime',
    },

    // Additional
    {
      name: 'View All Customers',
      key: 'view_all_customers',
      description: 'Allows viewing all customer profiles',
    },
    {
      name: 'View Active Customers',
      key: 'view_active_customers',
      description: 'Allows viewing active customer records',
    },
    {
      name: 'View All Product Statuses',
      key: 'view_all_product_statuses',
      description: 'Allows viewing all product status values',
    },
    {
      name: 'View All Warehouse Statuses',
      key: 'view_all_warehouse_statuses',
      description: 'Allows viewing all warehouse statuses including archived',
    },
    {
      name: 'View Archived Warehouses',
      key: 'view_archived_warehouses',
      description: 'Allows viewing archived warehouses',
    },
    {
      name: 'View Allocation Stage',
      key: 'view_allocation_stage',
      description: 'Allows viewing orders in the allocation stage only',
    },
    {
      name: 'View Fulfillment Stage',
      key: 'view_fulfillment_stage',
      description: 'Allows viewing orders in the fulfillment stage only',
    },
    {
      name: 'View Shipping Stage',
      key: 'view_shipping_stage',
      description: 'Allows viewing orders in the shipping stage only',
    },
  ];

  // Add category-specific order permissions
  const ACTION_META = {
    view: { label: 'View', gerund: 'viewing', plural: true },
    create: { label: 'Create', gerund: 'creating', plural: false },
    update: { label: 'Update', gerund: 'updating', plural: false },
    delete: { label: 'Delete', gerund: 'deleting', plural: false },
  };

  for (const category of ORDER_CATEGORIES) {
    const displayCategory =
      category.charAt(0).toUpperCase() + category.slice(1);
    const lcCategory = category.toLowerCase();

    for (const action of Object.values(GENERIC_ORDER_PERMISSIONS)) {
      const verb = action.split('_')[0]; // view/create/update/delete
      const meta = ACTION_META[verb] || {
        label: verb,
        gerund: `${verb}ing`,
        plural: true,
      };

      // Name: plural for view, singular for others
      const nameNoun = meta.plural
        ? `${displayCategory} Orders`
        : `${displayCategory} Order`;
      // Description: plural vs singular with article
      const descNoun = meta.plural
        ? `${lcCategory} orders`
        : `a ${lcCategory} order`;

      permissions.push({
        name: `${meta.label} ${nameNoun}`, // e.g., "Create Sales Order", "View Sales Orders"
        key: `${verb}_${category}_order`, // e.g., "create_order_sales" (kept as-is)
        description: `Allows ${meta.gerund} ${descNoun}`, // e.g., "Allows creating a sales order"
      });
    }
  }

  // Warn for duplicate keys
  const seen = new Set();
  const duplicateKeys = permissions
    .map((p) => p.key)
    .filter((key) => {
      if (seen.has(key)) return true;
      seen.add(key);
      return false;
    });

  if (duplicateKeys.length > 0) {
    console.warn(
      '[Permission Seed Warning] Duplicate permission keys found:',
      duplicateKeys
    );
  }

  let insertedCount = 0;

  for (const permission of permissions) {
    const id = knex.raw('uuid_generate_v4()');

    await knex('permissions')
      .insert({
        id,
        ...permission,
        ...baseFields,
      })
      .onConflict('key')
      .ignore();

    insertedCount++;
  }

  console.log(
    `${insertedCount} permissions processed (duplicates ignored in DB if existed).`
  );
};
