/**
 * @file outbound-fulfillment-business.js
 * @description Domain business logic for outbound fulfillment operations.
 * Covers allocation validation, shipment record construction, inventory
 * adjustment calculation, status transition validation, and bulk status updates.
 */

'use strict';

const {
  validateFullAllocationForFulfillment,
  updateOrderItemStatusesByOrderId,
} = require('../repositories/order-item-repository');
const { cleanObject }       = require('../utils/object-utils');
const { generateChecksum }  = require('../utils/crypto-utils');
const AppError              = require('../utils/AppError');
const {
  getAllocationsByOrderId,
  updateInventoryAllocationStatus,
} = require('../repositories/inventory-allocations-repository');
const { lockRows }          = require('../database/db');
const { getStatusId }       = require('../config/status-cache');
const {
  insertOutboundShipmentsBulk,
  updateOutboundShipmentStatus,
} = require('../repositories/outbound-shipment-repository');
const { updateOrderStatus } = require('../repositories/order-repository');
const {
  updateOrderFulfillmentStatus,
} = require('../repositories/order-fulfillment-repository');
const { uniqCompact } = require('../utils/array-utils');

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------

/**
 * Ordered sequence of valid fulfillment status codes.
 * Used to enforce forward-only status transitions.
 */
const FULFILLMENT_STATUS_SEQUENCE = [
  'FULFILLMENT_PENDING',
  'FULFILLMENT_PICKING',
  'FULFILLMENT_PACKED',
  'FULFILLMENT_SHIPPED',
  'FULFILLMENT_DELIVERED',
  'FULFILLMENT_CANCELLED',
];

/** Statuses from which no further transitions are permitted. */
const FULFILLMENT_FINAL_STATUSES = [
  'FULFILLMENT_DELIVERED',
  'FULFILLMENT_CANCELLED',
];

const ALLOWED_DELIVERY_METHODS = [
  'In-Store Pickup',
  'Personal Driver Delivery',
];

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if the given fulfillment status code is a terminal state.
 *
 * @param {string} code
 * @returns {boolean}
 */
const isFulfillmentStatusFinal = (code) =>
  FULFILLMENT_FINAL_STATUSES.includes(code);

/**
 * Locks allocation rows and updates their status.
 *
 * @param {object[]} allocationMeta
 * @param {string} allocationStatusId
 * @param {string} orderId
 * @param {string} orderNumber
 * @param {string} userId
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object>}
 */
const updateAllocationsStatus = async (
  allocationMeta,
  allocationStatusId,
  orderId,
  orderNumber,
  userId,
  client
) => {
  const allocationIds = allocationMeta.map((a) => a.allocation_id);
  
  await lockRows(client, 'inventory_allocations', allocationIds, 'FOR UPDATE', {
    stage: 'allocation-status-update',
    orderId,
    orderNumber,
    userId,
  });
  
  return updateInventoryAllocationStatus(
    { statusId: allocationStatusId, userId, allocationIds },
    client
  );
};

/**
 * Locks fulfillment rows and updates their status.
 *
 * @param {object[]} fulfillments
 * @param {string} newStatusId
 * @param {string} orderId
 * @param {string} orderNumber
 * @param {string} userId
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object[]>}
 */
const updateFulfillmentsStatus = async (
  fulfillments,
  newStatusId,
  orderId,
  orderNumber,
  userId,
  client
) => {
  const fulfillmentIds = fulfillments
    .map((f) => f.fulfillment_id)
    .filter(Boolean);
  
  if (!fulfillmentIds.length || !newStatusId) return [];
  
  await lockRows(client, 'order_fulfillments', fulfillmentIds, 'FOR UPDATE', {
    stage: 'fulfillment-status-update',
    orderId,
    orderNumber,
    userId,
  });
  
  return updateOrderFulfillmentStatus(
    { statusId: newStatusId, userId, fulfillmentIds },
    client
  );
};

/**
 * Locks shipment rows and updates their status.
 *
 * @param {object[]} fulfillments
 * @param {string} newStatusId
 * @param {string} orderId
 * @param {string} orderNumber
 * @param {string} userId
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object[]>}
 */
const updateShipmentsStatus = async (
  fulfillments,
  newStatusId,
  orderId,
  orderNumber,
  userId,
  client
) => {
  // Deduplicate — multiple fulfillments can share one shipment
  const shipmentIds = uniqCompact(fulfillments.map((f) => f.shipment_id));
  
  if (!shipmentIds.length || !newStatusId) return [];
  
  await lockRows(client, 'outbound_shipments', shipmentIds, 'FOR UPDATE', {
    stage:       'shipment-status-update',
    orderId,
    orderNumber,
    userId,
  });
  
  return updateOutboundShipmentStatus(
    { statusId: newStatusId, userId, shipmentIds },
    client
  );
};

/**
 * Builds a single inventory activity log entry for a fulfilled allocation.
 *
 * @param {object} options
 * @param {object} options.allocation - Enriched allocation record.
 * @param {object} options.update - Calculated inventory adjustment for this allocation.
 * @param {string} options.inventoryActionTypeId
 * @param {string} options.userId
 * @param {string} options.orderId
 * @param {string} options.shipmentId
 * @param {string} options.fulfillmentId
 * @param {string} options.orderNumber
 * @returns {object} Inventory activity log row.
 */
const buildFulfillmentLogEntry = ({
                                    allocation,
                                    update,
                                    inventoryActionTypeId,
                                    userId,
                                    orderId,
                                    shipmentId,
                                    fulfillmentId,
                                    orderNumber,
                                  }) => {
  const previous_quantity = allocation.warehouse_quantity;
  const quantity_change   = -allocation.allocated_quantity;
  const new_quantity      = update.warehouse_quantity;
  const comments = `[System] Inventory adjusted during fulfillment for order ${orderNumber}`;
  
  const metadata = cleanObject({
    batch_id:                   allocation.batch_id,
    allocation_id:              allocation.allocation_id,
    shipment_id:                shipmentId,
    fulfillment_id:             fulfillmentId,
    reserved_quantity_before:   allocation.reserved_quantity,
    reserved_quantity_after:    update.reserved_quantity,
    warehouse_quantity_snapshot: previous_quantity,
  });
  
  const checksum = generateChecksum({
    inventory_id:              allocation.warehouse_inventory_id,
    inventory_action_type_id:  inventoryActionTypeId,
    previous_quantity,
    quantity_change,
    new_quantity,
    source_action_id:          fulfillmentId,
    comments,
  });
  
  return cleanObject({
    warehouse_inventory_id:    allocation.warehouse_inventory_id,
    location_inventory_id:     null,
    inventory_action_type_id:  inventoryActionTypeId,
    adjustment_type_id:        null,
    order_id:                  orderId,
    status_id:                 update.status_id,
    previous_quantity,
    quantity_change,
    new_quantity,
    performed_by:              userId,
    recorded_by:               userId,
    comments,
    metadata,
    inventory_scope:           'warehouse',
    source_type:               'fulfillment',
    source_ref_id:             fulfillmentId,
    status_effective_at:       new Date().toISOString(),
    checksum,
  });
};

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

/**
 * Validates that all items in an order are fully allocated before fulfillment.
 *
 * @param {string} orderId
 * @param {import('pg').PoolClient} client
 * @returns {Promise<void>}
 * @throws {AppError} validationError if any items are under-allocated.
 */
const validateOrderIsFullyAllocated = async (orderId, client) => {
  const underAllocatedRow = await validateFullAllocationForFulfillment(
    orderId,
    client
  );
  
  if (underAllocatedRow) {
    throw AppError.validationError(
      'Order is not fully allocated. Fulfillment is only allowed when all items are fully allocated.',
      { orderId }
    );
  }
};

/**
 * Validates that a fulfillment status transition is permitted.
 *
 * Transitions must be forward-only within the status sequence. Transitions
 * from final statuses are always rejected.
 *
 * @param {string} currentCode - Current fulfillment status code.
 * @param {string} nextCode - Target fulfillment status code.
 * @returns {void}
 * @throws {AppError} validationError if the transition is invalid.
 */
const validateFulfillmentStatusTransition = (currentCode, nextCode) => {
  const currentIndex = FULFILLMENT_STATUS_SEQUENCE.indexOf(currentCode);
  const nextIndex    = FULFILLMENT_STATUS_SEQUENCE.indexOf(nextCode);
  
  if (currentIndex === -1 || nextIndex === -1) {
    throw AppError.validationError(
      `Invalid fulfillment status code(s): ${currentCode}, ${nextCode}`
    );
  }
  
  if (isFulfillmentStatusFinal(currentCode)) {
    throw AppError.validationError(
      `Cannot transition from final fulfillment status: ${currentCode}`
    );
  }
  
  if (nextIndex <= currentIndex) {
    throw AppError.validationError(
      `Cannot transition fulfillment status backward: ${currentCode} → ${nextCode}`
    );
  }
};

/**
 * Asserts that an allocation list is valid — non-empty and all records have
 * required fields and positive quantities.
 *
 * @param {object[]} [allocationMeta=[]]
 * @throws {AppError} notFoundError if empty. validationError if records are malformed.
 */
const assertAllocationsValid = (allocationMeta = []) => {
  if (!Array.isArray(allocationMeta) || allocationMeta.length === 0) {
    throw AppError.notFoundError('No allocations found for this order.');
  }
  
  for (const a of allocationMeta) {
    if (!a.allocation_id || !a.warehouse_id || !a.batch_id) {
      throw AppError.validationError(
        'Allocation data is missing required fields.',
        { allocation: a }
      );
    }
    if (a.allocated_quantity <= 0) {
      throw AppError.validationError(
        'Allocation quantity must be greater than zero.',
        { allocation: a }
      );
    }
  }
};

/**
 * Fetches and locks allocations for an order, then locks the corresponding
 * warehouse inventory rows.
 *
 * @param {string} orderId
 * @param {string[] | null} allocationIds - Specific allocation IDs to lock, or null for all.
 * @param {import('pg').PoolClient} client
 * @returns {Promise<{ allocationMeta: object[], warehouseBatchKeys: object[] }>}
 */
const getAndLockAllocations = async (orderId, allocationIds = null, client) => {
  const allocationMeta = await getAllocationsByOrderId(
    orderId,
    allocationIds,
    client
  );
  
  assertAllocationsValid(allocationMeta);
  
  const lockConditions = allocationMeta.map(({ batch_id, warehouse_id }) => ({
    warehouse_id,
    batch_id,
  }));
  
  await lockRows(client, 'warehouse_inventory', lockConditions, 'FOR UPDATE', {
    traceId: 'fulfillment',
    orderId,
  });
  
  return { allocationMeta, warehouseBatchKeys: lockConditions };
};

/**
 * Asserts that all allocations belong to a single warehouse.
 * Returns the warehouse ID if valid.
 *
 * @param {object[]} allocationMeta
 * @returns {string} The single warehouse ID.
 * @throws {AppError} validationError if allocations span multiple warehouses.
 */
const assertSingleWarehouseAllocations = (allocationMeta) => {
  const warehouseIds = [...new Set(allocationMeta.map((a) => a.warehouse_id))];
  
  if (warehouseIds.length > 1) {
    throw AppError.validationError(
      'Allocations span multiple warehouses. Split fulfillment per warehouse.',
      { warehouseIds }
    );
  }
  
  return warehouseIds[0];
};

/**
 * Creates an outbound shipment record for an order.
 *
 * @param {string} order_id
 * @param {string} warehouse_id
 * @param {string} delivery_method_id
 * @param {string | null} notes
 * @param {string} userId
 * @param {import('pg').PoolClient} client
 * @returns {Promise<object>} Created shipment row.
 */
const insertOutboundShipmentRecord = async (
  order_id,
  warehouse_id,
  delivery_method_id,
  notes,
  userId,
  client
) => {
  const [shipmentRow] = await insertOutboundShipmentsBulk(
    [
      {
        order_id,
        warehouse_id,
        delivery_method_id,
        tracking_number_id:     null,
        status_id:              getStatusId('outbound_shipment_init'),
        shipped_at:             null,
        expected_delivery_date: null,
        notes:                  notes ?? null,
        shipment_details:       null,
        created_by:             userId,
      },
    ],
    client
  );
  
  return shipmentRow;
};

/**
 * Builds shipment batch input rows from allocation metadata.
 *
 * @param {object[]} allocationMeta
 * @param {string} shipmentId
 * @param {string} fulfillmentId
 * @param {string | null} note
 * @param {string} userId
 * @returns {object[]}
 */
const buildShipmentBatchInputs = (
  allocationMeta,
  shipmentId,
  fulfillmentId,
  note,
  userId
) =>
  allocationMeta.map((a) => ({
    shipment_id:       shipmentId,
    fulfillment_id:    fulfillmentId,
    batch_id:          a.batch_id,
    quantity_shipped:  a.allocated_quantity,
    notes:             note ?? null,
    created_by:        userId,
  }));

/**
 * Builds fulfillment input rows from allocation metadata, grouping by
 * order item and shipment.
 *
 * @param {object[]} allocationMeta
 * @param {string} shipmentId
 * @param {string} userId
 * @param {string | null} notes
 * @returns {object[]}
 */
const buildFulfillmentInputsFromAllocations = (
  allocationMeta,
  shipmentId,
  userId,
  notes
) => {
  const statusId = getStatusId('order_fulfillment_init');
  const map = new Map();
  
  for (const a of allocationMeta) {
    const key      = `${a.order_item_id}-${shipmentId}`;
    const existing = map.get(key);
    
    if (existing) {
      existing.quantity_fulfilled += a.allocated_quantity;
      existing.allocation_ids.push(a.allocation_id);
    } else {
      map.set(key, {
        order_item_id:       a.order_item_id,
        allocation_id:       a.allocation_id,
        allocation_ids:      [a.allocation_id],
        quantity_fulfilled:  a.allocated_quantity,
        status_id:           statusId,
        shipment_id:         shipmentId,
        fulfillment_notes:   notes ?? null,
        fulfilled_by:        userId,
        created_by:          userId,
        updated_by:          userId,
      });
    }
  }
  
  return Array.from(map.values());
};

/**
 * Asserts that an order metadata record is present and valid.
 *
 * @param {object} orderMeta
 * @throws {AppError} notFoundError if missing or invalid.
 */
const assertOrderMeta = (orderMeta) => {
  if (!orderMeta || !orderMeta.order_id || !orderMeta.order_number) {
    throw AppError.notFoundError('Order metadata not found or invalid.');
  }
};

/**
 * Asserts that a fulfillment list is non-empty and all records have required IDs.
 *
 * @param {object[]} [fulfillments=[]]
 * @param {string} order_number
 * @throws {AppError} notFoundError if empty. validationError if records are malformed.
 */
const assertFulfillmentsValid = (fulfillments = [], order_number) => {
  if (!Array.isArray(fulfillments) || fulfillments.length === 0) {
    throw AppError.notFoundError(
      `No fulfillments found for order: ${order_number}`
    );
  }
  
  for (const f of fulfillments) {
    if (!f.fulfillment_id) {
      throw AppError.validationError('Fulfillment missing fulfillment_id.');
    }
    if (!f.shipment_id) {
      throw AppError.validationError('Fulfillment missing shipment_id.');
    }
  }
};

/**
 * Asserts that a shipment record exists and has a valid `shipment_id`.
 *
 * @param {object | null} shipment
 * @param {string} shipmentId
 * @throws {AppError} notFoundError if shipment is null.
 * @throws {AppError} validationError if shipment is missing `shipment_id`.
 */
const assertShipmentFound = (shipment, shipmentId) => {
  if (!shipment) {
    throw AppError.notFoundError(
      `Shipment with ID "${shipmentId}" was not found.`
    );
  }
  
  if (!shipment.shipment_id) {
    throw AppError.validationError(
      'Shipment record is malformed or missing `shipment_id`.'
    );
  }
};

/**
 * Asserts that the delivery method is permitted for manual fulfillment.
 *
 * Manual fulfillment is only allowed for pickup locations or specific
 * named delivery methods.
 *
 * @param {string | null} methodName - Delivery method name.
 * @param {boolean} isPickupLocation - Whether the method is a pickup location.
 * @throws {AppError} validationError if the method is not permitted.
 */
const assertDeliveryMethodIsAllowed = (methodName, isPickupLocation) => {
  const isAllowed =
    Boolean(isPickupLocation) ||
    ALLOWED_DELIVERY_METHODS.includes(methodName ?? '');
  
  if (!isAllowed) {
    throw AppError.validationError(
      `Manual fulfillment is only allowed for pickup or personal delivery. Found: ${methodName || 'none'}`
    );
  }
};

/**
 * Asserts that inventory records exist for the given allocations.
 *
 * @param {object[]} [inventoryMeta=[]]
 * @throws {AppError} notFoundError if empty.
 */
const assertInventoryCoverage = (inventoryMeta = []) => {
  if (!Array.isArray(inventoryMeta) || inventoryMeta.length === 0) {
    throw AppError.notFoundError('No inventory records found for allocations.');
  }
};

/**
 * Asserts that enriched allocations are non-empty and have required inventory fields.
 *
 * @param {object[]} [enrichedAllocations=[]]
 * @throws {AppError} businessError if empty or malformed.
 */
const assertEnrichedAllocations = (enrichedAllocations = []) => {
  if (!Array.isArray(enrichedAllocations) || enrichedAllocations.length === 0) {
    throw AppError.businessError('Enriched allocations are empty.');
  }
  
  for (const a of enrichedAllocations) {
    if (a.available_quantity == null || a.allocated_quantity == null) {
      throw AppError.validationError(
        'Enriched allocation missing required inventory fields.',
        { allocation: a }
      );
    }
  }
};

/**
 * Asserts that an inventory adjustments object is non-empty.
 *
 * @param {object} [updatesObject={}]
 * @throws {AppError} businessError if empty or invalid.
 */
const assertInventoryAdjustments = (updatesObject = {}) => {
  if (
    !updatesObject ||
    typeof updatesObject !== 'object' ||
    Object.keys(updatesObject).length === 0
  ) {
    throw AppError.businessError('No inventory adjustments calculated.');
  }
};

/**
 * Asserts that warehouse inventory records were updated during fulfillment.
 *
 * @param {object[] | string[]} [warehouseUpdates=[]]
 * @param {object} [context={}]
 * @throws {AppError} businessError if no records were updated.
 */
const assertWarehouseUpdatesApplied = (
  warehouseUpdates = [],
  context = {}
) => {
  if (
    !Array.isArray(warehouseUpdates) ||
    warehouseUpdates.length === 0
  ) {
    throw AppError.businessError(
      'No warehouse inventory records were updated during fulfillment adjustment.',
      context
    );
  }
};

/**
 * Asserts that all required status IDs have been resolved.
 *
 * @param {{ orderStatusId: string, shipmentStatusId: string, fulfillmentStatusId: string }} params
 * @throws {AppError} validationError if any status ID is missing.
 */
const assertStatusesResolved = ({
                                  orderStatusId,
                                  shipmentStatusId,
                                  fulfillmentStatusId,
                                }) => {
  if (!orderStatusId || !shipmentStatusId || !fulfillmentStatusId) {
    throw AppError.validationError('Invalid or unresolved status codes.', {
      orderStatusId,
      shipmentStatusId,
      fulfillmentStatusId,
    });
  }
};

/**
 * Asserts that an inventory action type ID was resolved by name.
 *
 * @param {string | null} inventoryActionTypeId
 * @param {string} name - The action type name that was looked up.
 * @throws {AppError} notFoundError if not resolved.
 */
const assertActionTypeIdResolved = (inventoryActionTypeId, name) => {
  if (!inventoryActionTypeId) {
    throw AppError.notFoundError(
      `Inventory action type not found for name: ${name}`
    );
  }
};

/**
 * Asserts that inventory activity logs were generated.
 *
 * Accepts either an array of log objects or an object with `activityLogIds`.
 *
 * @param {object[] | { activityLogIds: string[] }} logs
 * @param {string} [stage='logs'] - Stage label for error messages.
 * @throws {AppError} businessError if no logs were generated.
 */
const assertLogsGenerated = (logs, stage = 'logs') => {
  if (Array.isArray(logs)) {
    if (logs.length === 0) {
      throw AppError.businessError(
        `No inventory activity logs generated at stage: ${stage}`
      );
    }
  } else if (logs && typeof logs === 'object') {
    if (!logs.activityLogIds || logs.activityLogIds.length === 0) {
      throw AppError.businessError(
        `No inventory activity logs inserted at stage: ${stage}`
      );
    }
  } else {
    throw AppError.businessError(`Invalid log structure at stage: ${stage}`);
  }
};

/**
 * Validates that order, fulfillment, and shipment statuses are eligible
 * for fulfillment confirmation.
 *
 * @param {object} params
 * @param {string} params.orderStatusCode
 * @param {string | string[]} params.fulfillmentStatuses
 * @param {string} params.shipmentStatusCode
 * @throws {AppError} validationError if any status is not eligible.
 */
const validateStatusesBeforeConfirmation = ({
                                              orderStatusCode,
                                              fulfillmentStatuses,
                                              shipmentStatusCode,
                                            }) => {
  const fulfillmentCodes = Array.isArray(fulfillmentStatuses)
    ? fulfillmentStatuses
    : [fulfillmentStatuses];
  
  const ALLOWED = {
    order:       ['ORDER_PROCESSING', 'ORDER_FULFILLED'],
    fulfillment: ['FULFILLMENT_PENDING', 'FULFILLMENT_PICKING', 'FULFILLMENT_PARTIAL'],
    shipment:    ['SHIPMENT_PENDING'],
  };
  
  if (!ALLOWED.order.includes(orderStatusCode)) {
    throw AppError.validationError(
      `Order status "${orderStatusCode}" is not eligible for fulfillment confirmation.`
    );
  }
  
  for (const code of fulfillmentCodes) {
    if (!ALLOWED.fulfillment.includes(code)) {
      throw AppError.validationError(
        `Fulfillment with status "${code}" cannot be confirmed.`
      );
    }
  }
  
  if (!ALLOWED.shipment.includes(shipmentStatusCode)) {
    throw AppError.validationError(
      `Shipment status "${shipmentStatusCode}" is not eligible for fulfillment confirmation.`
    );
  }
};

/**
 * Enriches allocation records with matching warehouse inventory data.
 *
 * Builds an O(1) lookup map from inventory records keyed by
 * `warehouseId-batchId`, then merges inventory fields into each allocation.
 *
 * @param {object[]} allocationMeta
 * @param {object[]} inventoryMeta
 * @returns {object[]} Enriched allocation records.
 */
const enrichAllocationsWithInventory = (allocationMeta, inventoryMeta) => {
  const inventoryMap = new Map(
    inventoryMeta.map((i) => [`${i.warehouse_id}-${i.batch_id}`, i])
  );
  
  return allocationMeta.map((a) => {
    const inv = inventoryMap.get(`${a.warehouse_id}-${a.batch_id}`);
    const available_quantity =
      inv?.warehouse_quantity != null && inv?.reserved_quantity != null
        ? inv.warehouse_quantity - inv.reserved_quantity
        : null;
    
    return {
      ...a,
      ...inv,
      available_quantity,
      warehouse_inventory_id: inv?.id ?? null,
      inventory_status_id:    inv?.status_id ?? null,
    };
  });
};

/**
 * Calculates inventory quantity adjustments for each enriched allocation.
 *
 * Returns a map keyed by `warehouseId-batchId` containing the new warehouse
 * quantity, reserved quantity, status ID, and update timestamp.
 *
 * @param {object[]} enrichedAllocations
 * @returns {Record<string, { warehouse_quantity: number, reserved_quantity: number, status_id: string, last_update: Date }>}
 */
const calculateInventoryAdjustments = (enrichedAllocations) =>
  Object.fromEntries(
    enrichedAllocations.map((a) => {
      const key             = `${a.warehouse_id}-${a.batch_id}`;
      const newWarehouseQty = Math.max(0, a.warehouse_quantity - a.allocated_quantity);
      const newReservedQty  = Math.max(0, (a.reserved_quantity ?? 0) - a.allocated_quantity);
      
      return [
        key,
        {
          warehouse_quantity: newWarehouseQty,
          reserved_quantity:  newReservedQty,
          status_id: newWarehouseQty > 0
            ? getStatusId('inventory_in_stock')
            : getStatusId('inventory_out_of_stock'),
          last_update: new Date(),
        },
      ];
    })
  );

/**
 * Executes bulk status updates across order, order items, allocations,
 * fulfillments, and shipments within a single transaction.
 *
 * @param {object} options
 * @param {string} options.orderId
 * @param {string} options.orderNumber
 * @param {object[]} [options.allocationMeta=[]]
 * @param {string} options.newOrderStatusId
 * @param {string|null} [options.newAllocationStatusId]
 * @param {object[]} [options.fulfillments=[]]
 * @param {string|null} [options.newFulfillmentStatusId]
 * @param {string|null} [options.newShipmentStatusId]
 * @param {string} options.userId
 * @param {import('pg').PoolClient} options.client
 * @returns {Promise<{ orderStatusRow, orderItemStatusRow, inventoryAllocationStatusRow, orderFulfillmentStatusRow, shipmentStatusRow }>}
 */
const updateAllStatuses = async ({
                                   orderId,
                                   orderNumber,
                                   allocationMeta = [],
                                   newOrderStatusId,
                                   newAllocationStatusId,
                                   fulfillments = [],
                                   newFulfillmentStatusId,
                                   newShipmentStatusId,
                                   userId,
                                   client,
                                 }) => {
  const allocations      = Array.isArray(allocationMeta) ? allocationMeta : [];
  const fulfillmentList  = Array.isArray(fulfillments) ? fulfillments : [];
  
  const orderStatusRow = await updateOrderStatus(client, {
    orderId,
    newStatusId: newOrderStatusId,
    updatedBy:   userId,
  });
  
  const orderItemStatusRow = await updateOrderItemStatusesByOrderId(client, {
    orderId,
    newStatusId: newOrderStatusId,
    updatedBy:   userId,
  });
  
  const inventoryAllocationStatusRow =
    allocations.length && newAllocationStatusId
      ? await updateAllocationsStatus(
        allocations,
        newAllocationStatusId,
        orderId,
        orderNumber,
        userId,
        client
      )
      : [];
  
  const orderFulfillmentStatusRow =
    fulfillmentList.length && newFulfillmentStatusId
      ? await updateFulfillmentsStatus(
        fulfillmentList,
        newFulfillmentStatusId,
        orderId,
        orderNumber,
        userId,
        client
      )
      : [];
  
  const shipmentStatusRow =
    fulfillmentList.length && newShipmentStatusId
      ? await updateShipmentsStatus(
        fulfillmentList,
        newShipmentStatusId,
        orderId,
        orderNumber,
        userId,
        client
      )
      : [];
  
  return {
    orderStatusRow,
    orderItemStatusRow,
    inventoryAllocationStatusRow,
    orderFulfillmentStatusRow,
    shipmentStatusRow,
  };
};

/**
 * Builds inventory activity log rows for a set of fulfilled allocations.
 *
 * @param {object[]} allocations - Enriched allocation records.
 * @param {Record<string, object>} updatesObject - Inventory adjustment map from `calculateInventoryAdjustments`.
 * @param {object} options
 * @param {string} options.inventoryActionTypeId
 * @param {string} options.userId
 * @param {string} options.orderId
 * @param {string} options.shipmentId
 * @param {string} options.fulfillmentId
 * @param {string} options.orderNumber
 * @returns {object[]} Array of inventory activity log rows.
 */
const buildInventoryActivityLogs = (
  allocations,
  updatesObject,
  {
    inventoryActionTypeId,
    userId,
    orderId,
    shipmentId,
    fulfillmentId,
    orderNumber,
  }
) =>
  allocations.map((a) =>
    buildFulfillmentLogEntry({
      allocation: a,
      update:     updatesObject[`${a.warehouse_id}-${a.batch_id}`],
      inventoryActionTypeId,
      userId,
      orderId,
      shipmentId,
      fulfillmentId,
      orderNumber,
    })
  );

/**
 * Validates that all statuses are eligible for manual fulfillment completion.
 *
 * @param {object} params
 * @param {string} params.orderStatusCode
 * @param {string | string[]} params.orderItemStatusCode
 * @param {string | string[]} params.allocationStatuses
 * @param {string} params.shipmentStatusCode
 * @param {string | string[]} params.fulfillmentStatuses
 * @throws {AppError} validationError if any status is not eligible.
 */
const validateStatusesBeforeManualFulfillment = ({
                                                   orderStatusCode,
                                                   orderItemStatusCode,
                                                   allocationStatuses,
                                                   shipmentStatusCode,
                                                   fulfillmentStatuses,
                                                 }) => {
  const orderItemCodes    = Array.isArray(orderItemStatusCode) ? orderItemStatusCode : [orderItemStatusCode];
  const allocationCodes   = Array.isArray(allocationStatuses) ? allocationStatuses : [allocationStatuses];
  const fulfillmentCodes  = Array.isArray(fulfillmentStatuses) ? fulfillmentStatuses : [fulfillmentStatuses];
  
  const ALLOWED = {
    order:       ['ORDER_FULFILLED'],
    orderItem:   ['ORDER_FULFILLED'],
    allocation:  ['ALLOC_COMPLETED'],
    shipment:    ['SHIPMENT_READY'],
    fulfillment: ['FULFILLMENT_PACKED'],
  };
  
  if (!ALLOWED.order.includes(orderStatusCode)) {
    throw AppError.validationError(
      `Order status "${orderStatusCode}" is not eligible for manual fulfillment completion.`
    );
  }
  
  for (const code of orderItemCodes) {
    if (!ALLOWED.orderItem.includes(code)) {
      throw AppError.validationError(
        `Order item with status "${code}" is not eligible for manual fulfillment completion.`
      );
    }
  }
  
  for (const code of allocationCodes) {
    if (!ALLOWED.allocation.includes(code)) {
      throw AppError.validationError(
        `Allocation with status "${code}" is not eligible for manual fulfillment completion.`
      );
    }
  }
  
  if (!ALLOWED.shipment.includes(shipmentStatusCode)) {
    throw AppError.validationError(
      `Shipment status "${shipmentStatusCode}" is not eligible for manual fulfillment completion.`
    );
  }
  
  for (const code of fulfillmentCodes) {
    if (!ALLOWED.fulfillment.includes(code)) {
      throw AppError.validationError(
        `Fulfillment with status "${code}" cannot be marked as completed (manual fulfillment).`
      );
    }
  }
};

module.exports = {
  validateOrderIsFullyAllocated,
  validateFulfillmentStatusTransition,
  assertAllocationsValid,
  getAndLockAllocations,
  assertSingleWarehouseAllocations,
  insertOutboundShipmentRecord,
  buildShipmentBatchInputs,
  buildFulfillmentInputsFromAllocations,
  assertOrderMeta,
  assertFulfillmentsValid,
  assertShipmentFound,
  assertDeliveryMethodIsAllowed,
  assertInventoryCoverage,
  assertEnrichedAllocations,
  assertInventoryAdjustments,
  assertWarehouseUpdatesApplied,
  assertStatusesResolved,
  assertActionTypeIdResolved,
  assertLogsGenerated,
  validateStatusesBeforeConfirmation,
  enrichAllocationsWithInventory,
  calculateInventoryAdjustments,
  updateAllStatuses,
  buildFulfillmentLogEntry,
  buildInventoryActivityLogs,
  validateStatusesBeforeManualFulfillment,
};
