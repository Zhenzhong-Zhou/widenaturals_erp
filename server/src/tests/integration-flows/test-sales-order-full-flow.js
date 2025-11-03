const { pool, getUniqueScalarValue } = require('../../database/db');
const { initStatusCache } = require('../../config/status-cache');
const {
  createOrderService,
  updateOrderStatusService,
} = require('../../services/order-service');
const {
  allocateInventoryForOrderService,
  confirmInventoryAllocationService,
} = require('../../services/inventory-allocation-service');
const {
  fulfillOutboundShipmentService,
} = require('../../services/outbound-fulfillment-service');

(async () => {
  const client = await pool.connect();
  await initStatusCache();

  try {
    const now = new Date();

    // Step 1: Get user (Root Admin)
    const { rows } = await client.query(
      `SELECT id, role_id FROM users WHERE email = $1`,
      ['root@widenaturals.com']
    );
    const { id: userId, role_id } = rows[0];
    const enrichedUser = { id: userId, role: role_id };

    // Step 2: Lookup required foreign keys
    const [
      order_type_id,
      order_status_id,
      shipping_address_id,
      billing_address_id,
      customer_id,
      payment_method_id,
      discount_id,
      tax_rate_id,
      delivery_method_id,
      warehouse_id,
    ] = await Promise.all([
      getUniqueScalarValue(
        { table: 'order_types', where: { code: 'SALES_STD' }, select: 'id' },
        client
      ),
      getUniqueScalarValue(
        {
          table: 'order_status',
          where: { code: 'ORDER_PENDING' },
          select: 'id',
        },
        client
      ),
      getUniqueScalarValue(
        {
          table: 'addresses',
          where: { full_name: 'John Doe', label: 'Shipping' },
          select: 'id',
        },
        client
      ),
      getUniqueScalarValue(
        {
          table: 'addresses',
          where: { full_name: 'John Doe', label: 'Billing' },
          select: 'id',
        },
        client
      ),
      getUniqueScalarValue(
        {
          table: 'customers',
          where: { email: 'john.doe@example.com' },
          select: 'id',
        },
        client
      ),
      getUniqueScalarValue(
        {
          table: 'payment_methods',
          where: { code: 'CREDIT_CARD' },
          select: 'id',
        },
        client
      ),
      getUniqueScalarValue(
        {
          table: 'discounts',
          where: { name: 'New Customer Offer' },
          select: 'id',
        },
        client
      ),
      getUniqueScalarValue(
        {
          table: 'tax_rates',
          where: { name: 'PST', province: 'BC' },
          select: 'id',
        },
        client
      ),
      getUniqueScalarValue(
        {
          table: 'delivery_methods',
          where: { method_name: 'In-Store Pickup' },
          select: 'id',
        },
        client
      ),
      // getUniqueScalarValue({ table: 'delivery_methods', where: { method_name: 'Standard Shipping' }, select: 'id' }, client),
      getUniqueScalarValue(
        {
          table: 'warehouses',
          where: { name: 'WIDE Naturals Inc.' },
          select: 'id',
        },
        client
      ),
    ]);

    // Step 3: Lookup SKUs and packaging
    const [sku1, sku2, sku3, packaging_material_id_1] = await Promise.all([
      getUniqueScalarValue(
        { table: 'skus', where: { sku: 'PG-NM203-R-CA' }, select: 'id' },
        client
      ),
      getUniqueScalarValue(
        { table: 'skus', where: { sku: 'PG-NM208-R-CN' }, select: 'id' },
        client
      ),
      getUniqueScalarValue(
        { table: 'skus', where: { sku: 'CH-HN105-R-CA' }, select: 'id' },
        client
      ),
      getUniqueScalarValue(
        {
          table: 'packaging_materials',
          where: { name: 'Brand E Paper Bag - Medium (Brown)' },
          select: 'id',
        },
        client
      ),
    ]);

    // Step 4: Create sales order
    const orderData = {
      order_type_id,
      order_date: now,
      note: 'Full flow test — with outbound fulfillment',
      shipping_address_id,
      billing_address_id,
      customer_id,
      payment_method_id,
      currency_code: 'USD',
      exchange_rate: '1.41',
      discount_id,
      tax_rate_id,
      shipping_fee: 5.0,
      delivery_method_id,
      created_by: userId,
      updated_at: null,
      updated_by: null,
      order_items: [
        {
          sku_id: sku1,
          price_id: await getUniqueScalarValue(
            { table: 'pricing', where: { sku_id: sku1 }, select: 'id' },
            client
          ),
          quantity_ordered: 2,
          price: 20.0,
          status_id: order_status_id,
          created_by: userId,
        },
        {
          sku_id: sku3,
          price_id: await getUniqueScalarValue(
            { table: 'pricing', where: { sku_id: sku3 }, select: 'id' },
            client
          ),
          quantity_ordered: 20,
          price: null,
          status_id: order_status_id,
          created_by: userId,
        },
        {
          sku_id: sku2,
          price_id: await getUniqueScalarValue(
            { table: 'pricing', where: { sku_id: sku2 }, select: 'id' },
            client
          ),
          quantity_ordered: 20,
          price: 200.0,
          status_id: order_status_id,
          created_by: userId,
        },
        {
          packaging_material_id: packaging_material_id_1,
          quantity_ordered: 1,
          price: 0,
          status_id: order_status_id,
          created_by: userId,
        },
      ],
    };

    const order = await createOrderService(orderData, 'sales', enrichedUser);
    console.log('✅ Order created:', order.orderId);

    // Step 5: Confirm order
    const statusUpdate = await updateOrderStatusService(
      enrichedUser,
      'sales',
      order.orderId,
      'ORDER_CONFIRMED'
    );
    console.log(
      '✅ Order confirmed:',
      statusUpdate.enrichedItems.length,
      'items updated'
    );

    // Step 6: Allocate inventory
    const allocationResult = await allocateInventoryForOrderService(
      enrichedUser,
      order.orderId,
      {
        strategy: 'fefo',
        warehouseId: warehouse_id,
      }
    );
    console.log('✅ Inventory allocated:', allocationResult);

    // Step 7: Confirm allocation
    const confirmResult = await confirmInventoryAllocationService(
      enrichedUser,
      order.orderId
    );
    console.log('✅ Allocation confirmed:', confirmResult);

    // Step 8: Build fulfillment request
    const allocationIds = allocationResult?.allocations?.map((a) => a.id) || [];
    const requestData = {
      orderId: order.orderId,
      allocations: { ids: allocationIds },
      fulfillmentNotes: 'Automated test fulfillment',
      shipmentNotes: 'Handle with care',
      shipmentBatchNote: 'Test batch',
    };

    // Step 9: Fulfill outbound shipment
    const fulfillmentResult = await fulfillOutboundShipmentService(
      requestData,
      enrichedUser
    );
    console.log('✅ Outbound fulfillment completed:');
    console.dir(fulfillmentResult, { depth: 5 });
  } catch (err) {
    console.error('❌ Full flow failed:', err.stack || err.message);
  } finally {
    client.release();
  }
})();
