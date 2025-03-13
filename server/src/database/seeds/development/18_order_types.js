/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  console.log('🌱 Seeding order_types...');

  // Fetch active status ID and admin user ID
  const [activeStatus, systemAction] = await Promise.all([
    knex('status').select('id').where('name', 'active').first(),
    knex('users').select('id').where('email', 'system@internal.local').first(),
  ]);

  const activeStatusId = activeStatus?.id;
  const systemActionId = systemAction?.id;

  if (!activeStatusId || !systemActionId) {
    throw new Error('❌ Missing required references for status or admin user!');
  }

  // Define seed data
  const orderTypes = [
    {
      name: 'Purchase Order',
      category: 'purchase',
      code: 'PUR_ORDER',
      description: 'Order placed with a supplier',
    },
    {
      name: 'Warehouse Transfer',
      category: 'transfer',
      code: 'INV_TRSF',
      description: 'Stock transfer between warehouses',
    },
    {
      name: 'Inter-Store Transfer',
      category: 'transfer',
      code: 'STORE_TRSF',
      description: 'Stock transfer between stores',
    },
    {
      name: 'Standard Sales Order',
      category: 'sales',
      code: 'SALES_STD',
      description: 'Customer order for products',
    },
    {
      name: 'Customer Return',
      category: 'return',
      code: 'RET_CUST',
      description: 'Return of products by customer',
    },
    {
      name: 'Work Order',
      category: 'manufacturing',
      code: 'MFG_WORK',
      description: 'Order for production or assembly',
    },
    {
      name: 'Manufacturing Order',
      category: 'manufacturing',
      code: 'MFG_ORDER',
      description: 'Production order for manufacturing goods',
    },
    {
      name: 'Stock Adjustment',
      category: 'adjustment',
      code: 'INV_ADJ',
      description: 'Correction of stock discrepancies',
    },
    {
      name: 'Inventory Count',
      category: 'adjustment',
      code: 'INV_CNT',
      description: 'Inventory reconciliation after stocktake',
    },
    {
      name: 'Supplier Return',
      category: 'return',
      code: 'RET_SUPP',
      description: 'Returning defective/damaged goods to supplier',
    },
    {
      name: 'Shipping Order',
      category: 'logistics',
      code: 'SHIP_ORDER',
      description: 'Order for outbound shipment',
    },
    {
      name: 'Receiving Order',
      category: 'logistics',
      code: 'RECV_ORDER',
      description: 'Order for inbound goods receiving',
    },
  ];

  // Prepare insert statements with UUIDs
  const orderTypeRecords = orderTypes.map((type) => ({
    id: knex.raw('uuid_generate_v4()'),
    ...type,
    status_id: activeStatusId,
    status_date: knex.fn.now(),
    created_at: knex.fn.now(),
    updated_at: null,
    created_by: systemActionId,
    updated_by: null,
  }));

  // Perform batch insert with conflict handling
  await knex('order_types')
    .insert(orderTypeRecords)
    .onConflict('name') // Ensure uniqueness
    .ignore();

  console.log(`✅ Seeded ${orderTypes.length} order types successfully!`);
};
