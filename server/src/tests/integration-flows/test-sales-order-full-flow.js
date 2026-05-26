const { pool } = require('../../database/db');
const { getUniqueScalarValue } = require('../../utils/db/record-utils');
const {
  initStatusCache,
  initAllStatusCaches
} = require('../../config/status-cache');
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
  confirmOutboundFulfillmentService,
  completeOutboundFulfillmentService,
} = require('../../services/outbound-fulfillment-service');
const { buildCompletionPayload } = require('../utils/fulfillment-completion-fixtures');
const { getShipmentByShipmentId } = require('../../repositories/outbound-shipment-repository');

(async () => {
  const client = await pool.connect();
  await initStatusCache();
  await initAllStatusCaches();

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
      getUniqueScalarValue({
        table: 'order_types',
        where: { code: 'SALES_STD' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'order_status',
        where: { code: 'ORDER_PENDING' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'addresses',
        where: { full_name: 'Acme Corp', label: 'Shipping' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'addresses',
        where: { full_name: 'Acme Corp', label: 'Billing' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'customers',
        where: { email: 'john.doe@example.com' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'payment_methods',
        where: { code: 'CREDIT_CARD' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'discounts',
        where: { name: 'New Customer Offer' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'tax_rates',
        where: { name: 'PST', province: 'BC' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'delivery_methods',
        // where: { method_name: 'In-Store Pickup' },
        where: { method_name: 'Standard Shipping' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'warehouses',
        where: { name: 'WIDE Naturals Inc.' },
        select: 'id',
      }),
    ]);

    // Step 3: Lookup SKUs and packaging
    const [sku1, sku2, sku3, packaging_material_id_1] = await Promise.all([
      getUniqueScalarValue({
        table: 'skus',
        where: { sku: 'PG-NM203-R-CA' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'skus',
        where: { sku: 'PG-NM208-R-CN' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'skus',
        where: { sku: 'CH-HN105-R-CA' },
        select: 'id',
      }),
      getUniqueScalarValue({
        table: 'packaging_materials',
        where: { name: 'Brand E Paper Bag - Medium (Brown)' },
        select: 'id',
      }),
    ]);

    const getPricingGroupId = async (skuId) => {
      const { rows } = await pool.query(
        `SELECT pricing_group_id FROM pricing WHERE sku_id = $1 ORDER BY created_at ASC LIMIT 1`,
        [skuId]
      );
      return rows[0]?.pricing_group_id ?? null;
    };

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
          pricing_group_id: await getPricingGroupId(sku1),
          quantity_ordered: 2,
          price: 20.0,
          status_id: order_status_id,
          created_by: userId,
        },
        {
          sku_id: sku3,
          pricing_group_id: await getPricingGroupId(sku3),
          quantity_ordered: 20,
          price: null,
          status_id: order_status_id,
          created_by: userId,
        },
        {
          sku_id: sku2,
          pricing_group_id: await getPricingGroupId(sku2),
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
      allocations: { ids: allocationIds },
      fulfillmentNotes: 'Automated test fulfillment',
      shipmentNotes: 'Handle with care',
      shipmentBatchNote: 'Test batch',
    };

    // Step 9: Fulfill outbound shipment
    const fulfillmentResult = await fulfillOutboundShipmentService(
      requestData,
      order.orderId,
      enrichedUser
    );
    console.log('✅ Outbound fulfillment completed:');
    console.dir(fulfillmentResult, { depth: 5 });
    
    // Step 10: Confirm outbound fulfillment
    const confirmFulfillmentRequest = {
      orderStatus: 'ORDER_FULFILLED',
      allocationStatus: 'ALLOC_COMPLETED',
      shipmentStatus: 'SHIPMENT_READY',
      fulfillmentStatus: 'FULFILLMENT_PACKED',
    };
    
    const confirmFulfillmentResult = await confirmOutboundFulfillmentService(
      confirmFulfillmentRequest,
      order.orderId,
      enrichedUser
    );
    console.log('✅ Outbound fulfillment confirmed:');
    console.dir(confirmFulfillmentResult, { depth: 5 });
    
    // Step 11: Complete fulfillment
    const shipmentId = confirmFulfillmentResult?.shipment?.id;
    if (!shipmentId) {
      throw new Error('Missing shipmentId from confirm fulfillment result.');
    }

    // Read the actual shipment to determine pickup vs carrier.
    const shipmentInfo = await getShipmentByShipmentId(shipmentId, pool);
    if (!shipmentInfo) {
      throw new Error(`Shipment ${shipmentId} not found.`);
    }
    
    const isPickup = shipmentInfo.is_pickup_location;
    const isCarrierTracked = shipmentInfo.is_carrier_tracked === true;
    const completionData = buildCompletionPayload({ isPickup });
    
    console.log(`📦 Completing ${isPickup ? 'pickup' : 'carrier'} shipment ${shipmentId}`);
    console.log('⚙️  Completion payload:');
    console.dir(completionData, { depth: null });
    
    const expectedTrackingCount = completionData.trackings?.length ?? 0;

    // === Compute EXPECTED before the call (inputs only) ===
    const expectedShipmentStatusCode = isPickup
      ? 'SHIPMENT_COMPLETED'
      : isCarrierTracked
        ? 'SHIPMENT_IN_TRANSIT'
        : 'SHIPMENT_COMPLETED';
    const expectedOrderStatusCode = 'ORDER_SHIPPED';  // full-ship path
    
    console.log(`📦 Expecting shipment → ${expectedShipmentStatusCode}, order → ${expectedOrderStatusCode}`);

    // === Call the service ===
    const manualCompletionResult = await completeOutboundFulfillmentService(
      completionData,
      shipmentId,
      enrichedUser
    );
    
    console.log('✅ Fulfillment completed:');
    console.dir(manualCompletionResult, { depth: 5 });

    // === Verify shipment cascade ===
    const { rows: [shipmentAfter] } = await pool.query(
      `SELECT s.status_id, s.shipped_at, ss.code AS status_code
       FROM outbound_shipments s
       JOIN shipment_status ss ON s.status_id = ss.id
       WHERE s.id = $1`,
      [shipmentId]
    );
    
    if (!shipmentAfter) {
      throw new Error(`Shipment ${shipmentId} vanished after completion.`);
    }
    
    if (shipmentAfter.status_code !== expectedShipmentStatusCode) {
      throw new Error(
        `Shipment status cascade mismatch: expected ${expectedShipmentStatusCode}, ` +
        `got ${shipmentAfter.status_code}`
      );
    }
    
    const shouldHaveShippedAt =
      expectedShipmentStatusCode === 'SHIPMENT_IN_TRANSIT' ||
      expectedShipmentStatusCode === 'SHIPMENT_COMPLETED';
    
    if (shouldHaveShippedAt && !shipmentAfter.shipped_at) {
      throw new Error(
        `Shipment ${shipmentId} reached ${shipmentAfter.status_code} but shipped_at is null.`
      );
    }
    
    console.log(
      `✅ Shipment status correctly cascaded to ${shipmentAfter.status_code} ` +
      `(shipped_at: ${shipmentAfter.shipped_at ?? 'null'}).`
    );

    // === Verify order cascade ===
    const { rows: [orderAfter] } = await pool.query(
      `SELECT o.order_status_id, os.code AS status_code
       FROM orders o
       JOIN order_status os ON o.order_status_id = os.id
       WHERE o.id = $1`,
      [order.orderId]
    );
    
    if (!orderAfter) {
      throw new Error(`Order ${order.orderId} vanished after completion.`);
    }
    
    if (orderAfter.status_code !== expectedOrderStatusCode) {
      throw new Error(
        `Order status cascade mismatch: expected ${expectedOrderStatusCode}, ` +
        `got ${orderAfter.status_code}`
      );
    }
    console.log(`✅ Order status correctly cascaded to ${orderAfter.status_code}.`);

    // === Verify order_items cascade ===
    const { rows: itemsAfter } = await pool.query(
      `SELECT oi.id, os.code AS status_code
       FROM order_items oi
       JOIN order_status os ON oi.status_id = os.id
       WHERE oi.order_id = $1`,
      [order.orderId]
    );
    
    if (!itemsAfter.length) {
      throw new Error(`Order ${order.orderId} has no items after completion.`);
    }
    
    const mismatchedItems = itemsAfter.filter(
      (it) => it.status_code !== expectedOrderStatusCode
    );
    
    if (mismatchedItems.length) {
      throw new Error(
        `Order item status cascade mismatch on ${mismatchedItems.length} item(s): ` +
        mismatchedItems.map((it) => `${it.id}=${it.status_code}`).join(', ')
      );
    }
    console.log(`✅ ${itemsAfter.length} order item(s) cascaded to ${expectedOrderStatusCode}.`);

    // === Tracking assertions ===
    const returnedTrackings = manualCompletionResult.trackings ?? [];
    
    if (isPickup) {
      if (returnedTrackings.length) {
        throw new Error(
          `Pickup completion should return no trackings, got ${returnedTrackings.length}.`
        );
      }
    } else {
      if (returnedTrackings.length !== expectedTrackingCount) {
        throw new Error(
          `Carrier completion: expected ${expectedTrackingCount} trackings, ` +
          `got ${returnedTrackings.length}.`
        );
      }
      
      for (const t of returnedTrackings) {
        if (!t.id) {
          throw new Error(`Tracking row missing id (insert failed?): ${JSON.stringify(t)}`);
        }
      }
      console.log(`✅ ${returnedTrackings.length} tracking row(s) inserted with IDs.`);
      
      const sentTrackings = completionData.trackings ?? [];
      const returnedIds = returnedTrackings.map((t) => t.id);
      
      const { rows: dbTrackings } = await pool.query(
        `
          SELECT
           id,
           tracking_number,
           carrier,
           service_name,
           bol_number,
           freight_type,
           custom_notes
          FROM tracking_numbers
          WHERE id = ANY($1::uuid[])
          ORDER BY created_at ASC
        `,
        [returnedIds]
      );
      
      if (dbTrackings.length !== sentTrackings.length) {
        throw new Error(
          `Persisted ${dbTrackings.length} trackings, sent ${sentTrackings.length}.`
        );
      }
      
      // Spot-check that the tracking_number values from payload made it to DB
      const sentBolNumbers = sentTrackings.map((t) => t.bolNumber).filter(Boolean).sort();
      const dbBolNumbers = dbTrackings.map((t) => t.bol_number).filter(Boolean).sort();
      if (JSON.stringify(sentBolNumbers) !== JSON.stringify(dbBolNumbers)) {
        throw new Error(
          `BOL numbers in DB don't match payload.\n` +
          `  sent: ${JSON.stringify(sentBolNumbers)}\n` +
          `  db:   ${JSON.stringify(dbBolNumbers)}`
        );
      }
      
      console.log(`✅ ${dbTrackings.length} trackings verified in DB.`);
    }
  } catch (err) {
    console.error('❌ Full flow failed:', err.stack || err.message);
  } finally {
    client.release();
  }
})();
