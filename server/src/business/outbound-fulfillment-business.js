/**
 * @file outbound-fulfillment-business.js
 * @description Domain business logic for outbound fulfillment operations.
 *
 * Covers allocation validation and locking, shipment and fulfillment record
 * construction, inventory adjustment calculation, status transition validation,
 * bulk status updates across orders/items/allocations/fulfillments/shipments,
 * and inventory activity log entry construction for fulfillment confirmations.
 *
 * Exports:
 *
 * ─── Validation & Assertions ──────────────────────────────────────────────────
 *  - validateOrderIsFullyAllocated         — assert all order items are fully allocated
 *  - validateFulfillmentStatusTransition   — enforce forward-only fulfillment status transitions
 *  - validateStatusesBeforeConfirmation    — validate order/fulfillment/shipment eligibility
 *  - validateStatusesBeforeManualFulfillment — validate eligibility for manual fulfillment completion
 *  - assertAllocationsValid               — assert allocation list is non-empty and well-formed
 *  - assertOrderMeta                      — assert order metadata is present and valid
 *  - assertFulfillmentsValid              — assert fulfillment list is non-empty and well-formed
 *  - assertShipmentFound                  — assert shipment record exists and has required fields
 *  - assertDeliveryMethodIsAllowed        — assert delivery method permits manual fulfillment
 *  - assertInventoryCoverage              — assert inventory records exist for allocations
 *  - assertEnrichedAllocations            — assert enriched allocations are non-empty and well-formed
 *  - assertInventoryAdjustments           — assert computed adjustment array is non-empty
 *  - assertWarehouseUpdatesApplied        — assert warehouse inventory rows were updated
 *  - assertStatusesResolved               — assert all required status IDs were resolved
 *  - assertActionTypeIdResolved           — assert inventory action type ID was resolved
 *  - assertLogsGenerated                  — assert activity log entries were generated or inserted
 *
 * ─── Allocation & Inventory ───────────────────────────────────────────────────
 *  - getAndLockAllocations                — fetch and lock allocation and warehouse inventory rows
 *  - assertSingleWarehouseAllocations     — assert all allocations belong to one warehouse
 *  - enrichAllocationsWithInventory       — merge current inventory state into allocation records
 *  - calculateInventoryAdjustments        — compute quantity deltas per enriched allocation
 *
 * ─── Record Construction ──────────────────────────────────────────────────────
 *  - insertOutboundShipmentRecord         — create a single outbound shipment record
 *  - buildShipmentBatchInputs             — build shipment batch insert rows from allocations
 *  - buildFulfillmentInputsFromAllocations — build fulfillment insert rows grouped by order item
 *  - buildFulfillmentLogEntry             — build a single activity log entry for fulfillment confirmation
 *
 * ─── Status Updates ───────────────────────────────────────────────────────────
 *  - updateAllStatuses                    — bulk update order, item, allocation, fulfillment,
 *                                           and shipment statuses within a transaction
 */

'use strict';

const {
  validateFullAllocationForFulfillment,
  updateOrderItemStatusesByOrderId,
} = require('../repositories/order-item-repository');
const AppError              = require('../utils/AppError');
const {
  getAllocationsByOrderId,
  updateInventoryAllocationStatus,
} = require('../repositories/inventory-allocations-repository');
const { lockRows } = require('../utils/db/lock-modes');
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
 * Asserts that an inventory adjustments array is non-empty.
 *
 * @param {object[]} [updates=[]] - Computed adjustment rows from calculateInventoryAdjustments.
 * @throws {AppError} `businessError` — if the array is empty or not an array.
 */
const assertInventoryAdjustments = (updates = []) => {
  if (!Array.isArray(updates) || updates.length === 0) {
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
 * Asserts that inventory activity log entries were generated or inserted.
 *
 * @param {object[]} logs          - Log entries array to validate.
 * @param {string}   [stage='logs'] - Stage label used in the error message for traceability.
 * @throws {AppError} `businessError` — if the array is empty or not an array.
 */
const assertLogsGenerated = (logs, stage = 'logs') => {
  if (!Array.isArray(logs) || logs.length === 0) {
    throw AppError.businessError(
      `No inventory activity logs generated at stage: ${stage}`
    );
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
 * Computes warehouse inventory quantity deltas for each enriched allocation.
 *
 * Deducts `allocated_quantity` from both `warehouse_quantity` and
 * `reserved_quantity`, clamping each result at zero. Status resolution
 * is intentionally omitted — callers pass `statusId` via `resolveInventoryStatus`
 * when building the update inputs for `updateWarehouseInventoryQuantityBulk`.
 *
 * Pure function — no DB calls, no logging, no side effects.
 *
 * @param {object[]} enrichedAllocations - Allocation records enriched with current inventory state
 *                                         via enrichAllocationsWithInventory.
 * @returns {Array<{
 *   id:                string,
 *   warehouse_id:      string,
 *   batch_id:          string,
 *   warehouse_quantity: number,
 *   reserved_quantity:  number
 * }>} Flat update inputs ready for status resolution and bulk persistence.
 */
const calculateInventoryAdjustments = (enrichedAllocations) =>
  enrichedAllocations.map((a) => {
    const newWarehouseQty = Math.max(0, a.warehouse_quantity - a.allocated_quantity);
    const newReservedQty  = Math.max(0, (a.reserved_quantity ?? 0) - a.allocated_quantity);
    
    return {
      id:                a.warehouse_inventory_id,
      warehouse_id:      a.warehouse_id,
      batch_id:          a.batch_id,
      warehouse_quantity: newWarehouseQty,
      reserved_quantity:  newReservedQty,
    };
  });

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
  validateStatusesBeforeManualFulfillment,
};
