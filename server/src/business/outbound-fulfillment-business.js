const {
  validateFullAllocationForFulfillment,
  updateOrderItemStatusesByOrderId
} = require('../repositories/order-item-repository');
const { cleanObject } = require('../utils/object-utils');
const { generateChecksum } = require('../utils/crypto-utils');
const AppError = require('../utils/AppError');
const {
  getAllocationsByOrderId,
  updateInventoryAllocationStatus
} = require('../repositories/inventory-allocations-repository');
const { lockRows } = require('../database/db');
const { getStatusId } = require('../config/status-cache');
const { insertOutboundShipmentsBulk } = require('../repositories/outbound-shipment-repository');
const { updateOrderStatus } = require('../repositories/order-repository');
const { getInventoryAllocationStatusId } = require('../repositories/inventory-allocation-status-repository');

/**
 * Validates that an order is fully allocated before fulfillment.
 *
 * Business rule:
 *  - Fulfillment is only permitted if every order item has been fully allocated.
 *  - If any order item is under-allocated (pending or partial), the validation fails.
 *
 * Implementation details:
 *  - Delegates allocation check to `validateFullAllocationForFulfillment`.
 *  - Throws a domain-specific `AppError.validationError` if the order is not fully allocated.
 *
 * Usage:
 *  - Call this at the start of fulfillment services to enforce preconditions.
 *  - Intended for use inside a transactional context.
 *
 * @async
 * @function
 * @param {string} orderId - The ID of the order to validate
 * @param {Object} client - Database client/transaction context
 * @returns {Promise<void>} Resolves if the order is fully allocated
 * @throws {AppError} Validation error if any order items are under-allocated
 */
const validateOrderIsFullyAllocated = async (orderId, client) => {
  const underAllocatedRow = await validateFullAllocationForFulfillment(orderId, client);
  if (underAllocatedRow) {
    throw AppError.validationError(
      'Order is not fully allocated. Fulfillment is only allowed when all items are fully allocated.',
      { orderId }
    );
  }
};

// TODO: In next step may use if not should be removed
// Ordered list of valid fulfillment status transitions
const FULFILLMENT_STATUS_SEQUENCE = [
  'FULFILLMENT_PENDING',
  'FULFILLMENT_PICKING',
  'FULFILLMENT_PACKED',
  'FULFILLMENT_SHIPPED',
  'FULFILLMENT_DELIVERED',
  'FULFILLMENT_CANCELLED', // Cancellation can happen at any stage before delivered
];

// Final statuses — no further transitions allowed
const FULFILLMENT_FINAL_STATUSES = [
  'FULFILLMENT_DELIVERED',
  'FULFILLMENT_CANCELLED',
];

// TODO: later if use, enhance docstring
// Helper to check if a status is final
const isFulfillmentStatusFinal = (code) =>
  FULFILLMENT_FINAL_STATUSES.includes(code);

/**
 * Validates whether a fulfillment status can transition to a given next status.
 *
 * @param {string} currentCode - Current status code of the fulfillment.
 * @param {string} nextCode - Intended next status code.
 * @throws {AppError} If the transition is invalid or violates final status rules.
 */
const validateFulfillmentStatusTransition = (
  currentCode,
  nextCode
) => {
  const currentIndex = FULFILLMENT_STATUS_SEQUENCE.indexOf(currentCode);
  const nextIndex = FULFILLMENT_STATUS_SEQUENCE.indexOf(nextCode);
  
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
 * Fetches allocation metadata for an order and locks related warehouse inventory rows.
 *
 * Business rule:
 *  - Allocations must be locked before fulfillment to prevent race conditions
 *    with concurrent updates (e.g., other fulfillments or adjustments).
 *
 * Implementation details:
 *  - Delegates fetching to `getAllocationsByOrderId`.
 *  - Builds lock conditions based on `{ warehouse_id, batch_id }` pairs.
 *  - Uses `lockRows` with `FOR UPDATE` to enforce row-level locking.
 *
 * Usage:
 *  - Call before performing any inventory adjustments or shipment inserts.
 *  - Intended to be executed within a database transaction.
 *
 * @async
 * @function
 * @param {string} orderId - The ID of the order whose allocations should be fetched
 * @param {string[]} allocationIds - Array of allocation IDs to fetch and lock
 * @param {Object} client - Database client/transaction context
 * @returns {Promise<Object[]>} Allocation metadata including warehouse_id and batch_id
 * @throws {AppError} If allocations cannot be fetched or rows cannot be locked
 */
const getAndLockAllocations = async (orderId, allocationIds, client) => {
  const allocationMeta = await getAllocationsByOrderId(orderId, allocationIds, client);
  const lockConditions = allocationMeta.map(({ batch_id, warehouse_id }) => ({
    warehouse_id: warehouse_id,
    batch_id: batch_id,
  }));
  
  await lockRows(client, 'warehouse_inventory', lockConditions, 'FOR UPDATE', {
    traceId: 'fulfillment',
    orderId,
  });
  
  return allocationMeta;
};

/**
 * Ensures that all allocations belong to a single warehouse.
 *
 * Business rule:
 *  - A fulfillment process cannot span multiple warehouses.
 *  - If allocations belong to more than one warehouse, fulfillment
 *    must be split per warehouse.
 *
 * Implementation details:
 *  - Extracts unique `warehouse_id` values from allocation metadata.
 *  - If more than one unique warehouse is detected, throws a validation error.
 *  - Otherwise, returns the single warehouse ID.
 *
 * Usage:
 *  - Call after fetching allocation metadata and before inserting shipment records.
 *  - Intended to enforce warehouse isolation at the service layer.
 *
 * @async
 * @function
 * @param {Object[]} allocationMeta - List of allocation metadata objects
 * @param {string} allocationMeta[].warehouse_id - Warehouse ID associated with each allocation
 * @returns {string} The single warehouse ID if all allocations belong to one warehouse
 * @throws {AppError} If allocations span multiple warehouses
 */
const assertSingleWarehouseAllocations = (allocationMeta) => {
  const warehouseIds = [...new Set(allocationMeta.map(a => a.warehouse_id))];
  if (warehouseIds.length > 1) {
    throw AppError.validationError(
      'Allocations span multiple warehouses. Split fulfillment per warehouse.',
      { warehouseIds }
    );
  }
  return warehouseIds[0];
};

/**
 * Inserts a new outbound shipment record for a given order and warehouse.
 *
 * Business rule:
 *  - A shipment is created when fulfilling an order from a warehouse.
 *  - Initial status is set to `outbound_shipment_init`.
 *  - Shipment may later be updated with tracking, shipped_at, and delivery info.
 *
 * Usage:
 *  - Call after validating allocations and enforcing warehouse isolation.
 *  - Intended to persist shipment metadata before creating fulfillments and batches.
 *
 * @async
 * @function
 * @param {string} order_id - The ID of the order being fulfilled
 * @param {string} warehouse_id - The ID of the warehouse where the shipment originates
 * @param {string|null} delivery_method_id - The delivery method ID (optional for some flows)
 * @param {string|null} notes - Optional shipment notes
 * @param {string} userId - The user ID performing the operation
 * @param {Object} client - Database client/transaction context
 * @returns {Promise<Object>} The inserted shipment row
 * @throws {AppError} If the shipment cannot be created
 */
const insertOutboundShipmentRecord = async (order_id, warehouse_id, delivery_method_id, notes, userId, client) => {
  const shipmentStatusId = getStatusId('outbound_shipment_init');
  const shipmentInput = {
    order_id,
    warehouse_id,
    delivery_method_id,
    tracking_number_id: null,
    status_id: shipmentStatusId,
    shipped_at: null,
    expected_delivery_date: null,
    notes: notes ?? null,
    shipment_details: null,
    created_by: userId,
  };
  const [shipmentRow] = await insertOutboundShipmentsBulk([shipmentInput], client);
  return shipmentRow;
};

/**
 * Builds input payloads for creating shipment batch records from allocation metadata.
 *
 * Business rule:
 *  - Each allocation fulfilled must be represented in the shipment batch table.
 *  - Shipment batches record the shipped quantity of each batch tied to a shipment.
 *
 * Usage:
 *  - Call immediately after inserting a shipment record.
 *  - Intended to prepare insert-ready objects for `insertShipmentBatchesBulk`.
 *
 * @async
 * @function
 * @param {Object[]} allocationMeta - List of allocation metadata objects
 * @param {string} allocationMeta[].batch_id - The batch ID linked to the allocation
 * @param {number} allocationMeta[].allocated_quantity - The quantity allocated per batch
 * @param {string} shipmentId - The ID of the outbound shipment
 * @param {string|null} note - Optional notes for the shipment batch
 * @param {string} userId - The ID of the user creating the records
 * @returns {Object[]} Array of shipment batch input objects ready for database insertion
 * @example
 * // Example output for a single allocation
 * [{
 *   shipment_id: "ship-123",
 *   batch_id: "batch-456",
 *   quantity_shipped: 100,
 *   notes: "Priority shipment",
 *   created_by: "user-789"
 * }]
 */
const buildShipmentBatchInputs = (allocationMeta, shipmentId, note, userId) => {
  return allocationMeta.map(a => ({
    shipment_id: shipmentId,
    batch_id: a.batch_id,
    quantity_shipped: a.allocated_quantity,
    notes: note ?? null,
    created_by: userId,
  }));
};

/**
 * Builds input payloads for creating fulfillment records from allocation metadata.
 *
 * Business rule:
 *  - Each fulfillment record represents quantities shipped for a specific order item.
 *  - Allocations for the same order item and shipment are aggregated into one fulfillment.
 *  - Initial fulfillment status is set to `order_fulfillment_init`.
 *
 * Usage:
 *  - Call after inserting a shipment record and before persisting fulfillments.
 *  - Intended to prepare insert-ready objects for `insertOrderFulfillmentsBulk`.
 *
 * @async
 * @function
 * @param {Object[]} allocationMeta - List of allocation metadata objects
 * @param {string} allocationMeta[].order_item_id - ID of the order item being fulfilled
 * @param {string} allocationMeta[].allocation_id - ID of the allocation entry
 * @param {number} allocationMeta[].allocated_quantity - Quantity allocated for fulfillment
 * @param {string} shipmentId - The ID of the outbound shipment
 * @param {string} userId - The ID of the user performing the fulfillment
 * @param {string|null} notes - Optional notes for the fulfillment
 * @returns {Object[]} Array of fulfillment input objects ready for database insertion
 * @example
 * // Example output for a single allocation
 * [{
 *   order_item_id: "oi-123",
 *   allocation_id: "alloc-456",
 *   allocation_ids: ["alloc-456"],
 *   quantity_fulfilled: 50,
 *   status_id: "<uuid for order_fulfillment_init>",
 *   shipment_id: "ship-789",
 *   fulfillment_notes: "First half shipped",
 *   fulfilled_by: "user-001",
 *   created_by: "user-001",
 *   updated_by: "user-001"
 * }]
 */
const buildFulfillmentInputsFromAllocations = (allocationMeta, shipmentId, userId, notes) => {
  const statusId = getStatusId('order_fulfillment_init');
  const map = new Map();
  
  allocationMeta.forEach(a => {
    const key = `${a.order_item_id}-${shipmentId}`;
    const existing = map.get(key);
    
    if (existing) {
      existing.quantity_fulfilled += a.allocated_quantity;
      existing.allocation_ids.push(a.allocation_id);
    } else {
      map.set(key, {
        order_item_id: a.order_item_id,
        allocation_id: a.allocation_id,
        allocation_ids: [a.allocation_id],
        quantity_fulfilled: a.allocated_quantity,
        status_id: statusId,
        shipment_id: shipmentId,
        fulfillment_notes: notes ?? null,
        fulfilled_by: userId,
        created_by: userId,
        updated_by: userId,
      });
    }
  });
  
  return Array.from(map.values());
};

/**
 * Enriches allocation metadata with corresponding warehouse inventory details.
 *
 * Business rule:
 *  - Each allocation must be paired with its warehouse inventory record
 *    to calculate adjustments and log activity during fulfillment.
 *  - Matching is performed on `{ warehouse_id, batch_id }`.
 *
 * Usage:
 *  - Call after fetching both allocation metadata and warehouse inventory records.
 *  - Intended to prepare enriched allocation objects for inventory updates and logging.
 *
 * Performance:
 *  - Current approach with `.find` is O(n × m).
 *  - Refactored version uses a lookup Map for O(n + m).
 *
 * @async
 * @function
 * @param {Object[]} allocationMeta - List of allocation metadata objects
 * @param {string} allocationMeta[].warehouse_id - Warehouse ID of the allocation
 * @param {string} allocationMeta[].batch_id - Batch ID of the allocation
 * @param {Object[]} inventoryMeta - List of warehouse inventory records
 * @param {string} inventoryMeta[].id - Inventory record ID
 * @param {string} inventoryMeta[].warehouse_id - Warehouse ID of the inventory record
 * @param {string} inventoryMeta[].batch_id - Batch ID of the inventory record
 * @param {string} inventoryMeta[].status_id - Current inventory status ID
 * @returns {Object[]} Enriched allocation objects with inventory details
 */
const enrichAllocationsWithInventory = (allocationMeta, inventoryMeta) => {
  // Build lookup map: key = "warehouseId-batchId"
  const inventoryMap = new Map(
    inventoryMeta.map(i => [`${i.warehouse_id}-${i.batch_id}`, i])
  );
  
  // Enrich allocations using O(1) lookups
  return allocationMeta.map(a => {
    const inv = inventoryMap.get(`${a.warehouse_id}-${a.batch_id}`);
    return {
      ...a,
      ...inv,
      warehouse_inventory_id: inv?.id ?? null,
      inventory_status_id: inv?.status_id ?? null,
    };
  });
};

/**
 * Calculates updated warehouse inventory adjustments from enriched allocations.
 *
 * Business rule:
 *  - Each allocation reduces both warehouse quantity and reserved quantity.
 *  - New status is derived from whether stock remains after the adjustment.
 *    - `inventory_in_stock` if quantity > 0
 *    - `inventory_out_of_stock` if quantity <= 0
 *
 * Usage:
 *  - Call after enriching allocations with inventory data.
 *  - Intended to produce update-ready objects for bulk inventory updates.
 *
 * Performance:
 *  - O(n) time, O(n) space where n = number of enriched allocations.
 *  - Already optimized: single pass with no nested loops.
 *
 * @async
 * @function
 * @param {Object[]} enrichedAllocations - Allocations enriched with inventory data
 * @param {string} enrichedAllocations[].warehouse_id - Warehouse ID
 * @param {string} enrichedAllocations[].batch_id - Batch ID
 * @param {number} enrichedAllocations[].warehouse_quantity - Current warehouse quantity
 * @param {number} enrichedAllocations[].reserved_quantity - Current reserved quantity
 * @param {number} enrichedAllocations[].allocated_quantity - Quantity allocated for fulfillment
 * @returns {Object} Keyed by "warehouseId-batchId", each entry contains:
 *  - {number} warehouse_quantity - New warehouse quantity
 *  - {number} reserved_quantity - New reserved quantity
 *  - {string} status_id - New status ID (`in_stock` or `out_of_stock`)
 * @example
 * // Example output
 * {
 *   "wh1-batchA": {
 *     warehouse_quantity: 80,
 *     reserved_quantity: 10,
 *     status_id: "uuid-in_stock"
 *   },
 *   "wh2-batchB": {
 *     warehouse_quantity: 0,
 *     reserved_quantity: 0,
 *     status_id: "uuid-out_of_stock"
 *   }
 * }
 */
const calculateInventoryAdjustments = (enrichedAllocations) => {
  return Object.fromEntries(
    enrichedAllocations.map(a => {
      const key = `${a.warehouse_id}-${a.batch_id}`;
      const newWarehouseQty = Math.max(0, a.warehouse_quantity - a.allocated_quantity);
      const newReservedQty = Math.max(0, (a.reserved_quantity ?? 0) - a.allocated_quantity);
      
      const newStatusId =
        newWarehouseQty > 0
          ? getStatusId('inventory_in_stock')
          : getStatusId('inventory_out_of_stock');
      
      return [
        key,
        {
          warehouse_quantity: newWarehouseQty,
          reserved_quantity: newReservedQty,
          status_id: newStatusId,
        },
      ];
    })
  );
};

/**
 * Updates statuses for order, order items, and allocations during fulfillment.
 *
 * Business rule:
 *  - When fulfillment begins, the order and its items transition to a new status
 *    (e.g., `ORDER_PROCESSING`).
 *  - Allocations transition to `ALLOC_FULFILLING` to indicate they are being consumed.
 *  - All relevant allocation rows are locked before update to ensure concurrency safety.
 *
 * Usage:
 *  - Call after inventory adjustments are prepared but before inserting logs.
 *  - Intended to synchronize status changes across all related entities in one step.
 *
 * Performance:
 *  - O(n) to collect allocation IDs.
 *  - Executes three DB updates (order, order items, allocations).
 *  - Already optimized: explicit row locking and bulk allocation update.
 *
 * @async
 * @function
 * @param {string} orderId - The ID of the order being updated
 * @param {Object[]} allocationMeta - List of allocation metadata objects
 * @param {string} allocationMeta[].allocation_id - Allocation ID for each row
 * @param {string} newOrderStatusId - The new status ID for the order and order items
 * @param {string} userId - The ID of the user performing the operation
 * @param {Object} client - Database client/transaction context
 * @returns {Promise<Object>} Updated status rows:
 *  - {Object} orderStatusRow - Updated order status row
 *  - {Object} orderItemStatusRow - Updated order item status row(s)
 *  - {Object} inventoryAllocationStatusRow - Updated allocation status rows
 */
const updateAllStatuses = async (orderId, allocationMeta, newOrderStatusId, userId, client) => {
  const orderStatusRow = await updateOrderStatus(client, {
    orderId,
    newStatusId: newOrderStatusId,
    updatedBy: userId,
  });
  
  const orderItemStatusRow = await updateOrderItemStatusesByOrderId(client, {
    orderId,
    newStatusId: newOrderStatusId,
    updatedBy: userId,
  });
  
  const allocationFulfillingId = await getInventoryAllocationStatusId('ALLOC_FULFILLING', client);
  const allocationIds = allocationMeta.map(a => a.allocation_id);
  
  await lockRows(client, 'inventory_allocations', allocationIds, 'FOR UPDATE', {
    traceId: 'fulfillment',
    orderId,
  });
  
  const inventoryAllocationStatusRow = await updateInventoryAllocationStatus({
    statusId: allocationFulfillingId,
    userId,
    allocationIds,
  }, client);
  
  return {
    orderStatusRow,
    orderItemStatusRow,
    inventoryAllocationStatusRow,
  };
};

/**
 * Builds a fulfillment inventory activity log entry.
 *
 * Business rule:
 *  - Every fulfillment event must generate a warehouse inventory log entry
 *    for auditing, traceability, and reconciliation.
 *  - Captures before/after reserved and warehouse quantities, along with allocation references.
 *  - Includes a checksum to ensure data integrity.
 *
 * Usage:
 *  - Call inside fulfillment services when consuming allocations.
 *  - Intended for insertion into `inventory_activity_log`.
 *
 * Performance:
 *  - O(1), constructs a single log object.
 *  - Optimized: uses `cleanObject` to strip null/undefined fields.
 *
 * @async
 * @function
 * @param {Object} params - Parameters for building the log entry
 * @param {Object} params.allocation - Allocation metadata
 * @param {Object} params.update - Inventory update object
 * @param {string} params.inventoryActionTypeId - Inventory action type (e.g., "fulfillment")
 * @param {string} params.userId - ID of the user performing the operation
 * @param {string} params.orderId - ID of the order
 * @param {string} params.shipmentId - ID of the outbound shipment
 * @param {string} params.fulfillmentId - ID of the fulfillment record
 * @param {string|null} params.fulfillmentNotes - Optional notes about the fulfillment
 * @param {string} params.orderNumber - Human-readable order number
 * @returns {Object} Fulfillment log entry object including:
 *  - Warehouse inventory details
 *  - Quantity before, change, and after
 *  - Metadata (batch, allocation, shipment, fulfillment)
 *  - Integrity checksum
 * @example
 * buildFulfillmentLogEntry({
 *   allocation: {
 *     allocation_id: "alloc-123",
 *     batch_id: "batch-xyz",
 *     allocated_quantity: 10,
 *     warehouse_quantity: 100,
 *     reserved_quantity: 20,
 *     warehouse_inventory_id: "inv-555"
 *   },
 *   update: {
 *     warehouse_quantity: 90,
 *     reserved_quantity: 10,
 *     status_id: "in_stock"
 *   },
 *   inventoryActionTypeId: "fulfillment",
 *   userId: "user-789",
 *   orderId: "order-001",
 *   shipmentId: "ship-002",
 *   fulfillmentId: "fulfill-003",
 *   fulfillmentNotes: "Priority shipment",
 *   orderNumber: "SO-2025-0001"
 * });
 */
const buildFulfillmentLogEntry = ({
                                    allocation,
                                    update,
                                    inventoryActionTypeId,
                                    userId,
                                    orderId,
                                    shipmentId,
                                    fulfillmentId,
                                    fulfillmentNotes,
                                    orderNumber
                                  }) => {
  const previous_quantity = allocation.warehouse_quantity;
  const quantity_change = -allocation.allocated_quantity;
  const new_quantity = update.warehouse_quantity;
  const comments = fulfillmentNotes ?? `Fulfillment started for order ${orderNumber}`;
  
  const metadata = cleanObject({
    batch_id: allocation.batch_id,
    allocation_id: allocation.allocation_id,
    shipment_id: shipmentId,
    fulfillment_id: fulfillmentId,
    reserved_quantity_before: allocation.reserved_quantity,
    reserved_quantity_after: update.reserved_quantity,
    warehouse_quantity_snapshot: previous_quantity,
  });
  
  const checksumPayload = cleanObject( {
    warehouse_inventory_id: allocation.warehouse_inventory_id,
    inventory_action_type_id: inventoryActionTypeId,
    adjustment_type_id: null,
    order_id: orderId,
    status_id: update.status_id,
    quantity_change,
    new_quantity,
    comments,
    performed_by: userId,
    recorded_by: userId,
    inventory_scope: 'warehouse',
    source_type: 'fulfillment',
    source_ref_id: fulfillmentId,
    ...metadata,
  });
  
  return cleanObject({
    warehouse_inventory_id: allocation.warehouse_inventory_id,
    location_inventory_id: null,
    inventory_action_type_id: inventoryActionTypeId,
    adjustment_type_id: null,
    order_id: orderId,
    status_id: update.status_id,
    previous_quantity,
    quantity_change,
    new_quantity,
    performed_by: userId,
    recorded_by: userId,
    comments,
    metadata,
    inventory_scope: 'warehouse',
    source_type: 'fulfillment',
    source_ref_id: fulfillmentId,
    status_effective_at: new Date().toISOString(),
    checksum: generateChecksum(checksumPayload),
  });
};

/**
 * Builds inventory activity log entries for all enriched allocations.
 *
 * Business rule:
 *  - Each allocation fulfilled must generate an inventory activity log entry.
 *  - Logs are created by delegating to `buildFulfillmentLogEntry` for consistency.
 *  - Links allocations to their corresponding inventory updates.
 *
 * Usage:
 *  - Call after calculating inventory adjustments and before inserting logs into the database.
 *  - Intended to generate bulk log payloads for `insertInventoryActivityLogs`.
 *
 * Performance:
 *  - O(n) where n = number of enriched allocations.
 *  - Optimized: single pass, O(1) lookups in updatesObject.
 *
 * @async
 * @function
 * @param {Object[]} enrichedAllocations - List of enriched allocation objects
 * @param {Object} updatesObject - Map of updates keyed by "warehouseId-batchId"
 * @param {Object} options - Additional log parameters
 * @param {string} options.inventoryActionTypeId - ID of the inventory action type
 * @param {string} options.userId - ID of the user performing the action
 * @param {string} options.orderId - ID of the order
 * @param {string} options.shipmentId - ID of the shipment
 * @param {string} options.fulfillmentId - ID of the fulfillment
 * @param {string|null} options.fulfillmentNotes - Optional fulfillment notes
 * @param {string} options.orderNumber - Human-readable order number
 * @returns {Object[]} Array of inventory activity log entries
 */
const buildInventoryActivityLogs = (enrichedAllocations, updatesObject, {
  inventoryActionTypeId,
  userId,
  orderId,
  shipmentId,
  fulfillmentId,
  fulfillmentNotes,
  orderNumber
}) => {
  return enrichedAllocations.map(a =>
    buildFulfillmentLogEntry({
      allocation: a,
      update: updatesObject[`${a.warehouse_id}-${a.batch_id}`],
      inventoryActionTypeId,
      userId,
      orderId,
      shipmentId,
      fulfillmentId,
      fulfillmentNotes,
      orderNumber
    })
  );
};

module.exports = {
  validateOrderIsFullyAllocated,
  validateFulfillmentStatusTransition,
  getAndLockAllocations,
  assertSingleWarehouseAllocations,
  insertOutboundShipmentRecord,
  buildShipmentBatchInputs,
  buildFulfillmentInputsFromAllocations,
  enrichAllocationsWithInventory,
  calculateInventoryAdjustments,
  updateAllStatuses,
  buildFulfillmentLogEntry,
  buildInventoryActivityLogs,
};
