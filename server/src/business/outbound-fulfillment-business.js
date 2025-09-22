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
const { insertOutboundShipmentsBulk, updateOutboundShipmentStatus } = require('../repositories/outbound-shipment-repository');
const { updateOrderStatus } = require('../repositories/order-repository');
const { updateOrderFulfillmentStatus } = require('../repositories/order-fulfillment-repository');

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
 * Assert that allocations exist and contain valid fields.
 *
 * Business rule:
 *  - Each allocation must reference a valid ID, warehouse, and batch.
 *  - Quantities must be greater than zero before fulfillment.
 *
 * @param {Array} allocationMeta - Array of allocation metadata objects
 * @throws {AppError} NotFoundError if no allocations are found
 * @throws {AppError} ValidationError if required fields or quantities are invalid
 */
const assertAllocationsValid = (allocationMeta = []) => {
  if (!Array.isArray(allocationMeta) || allocationMeta.length === 0) {
    throw AppError.notFoundError('No allocations found for this order.');
  }
  
  allocationMeta.forEach((a) => {
    if (!a.allocation_id || !a.warehouse_id || !a.batch_id) {
      throw AppError.validationError('Allocation data is missing required fields.', { allocation: a });
    }
    if (a.allocated_quantity <= 0) {
      throw AppError.validationError('Allocation quantity must be greater than zero.', { allocation: a });
    }
  });
};

/**
 * Fetch allocations for an order and lock related warehouse inventory rows.
 *
 * Business rules:
 *  - Allocations must be validated and locked before fulfillment to prevent race
 *    conditions with concurrent adjustments or shipments.
 *  - Locking is applied at the `warehouse_inventory` level using `(warehouse_id, batch_id)`
 *    pairs derived from the allocations.
 *
 * Implementation details:
 *  - Delegates fetching to `getAllocationsByOrderId`.
 *  - Validates allocation integrity via `assertAllocationsValid`.
 *  - Builds lock conditions from `{ warehouse_id, batch_id }` pairs.
 *  - Executes `lockRows` with `FOR UPDATE` to enforce row-level locking.
 *
 * Usage:
 *  - Call at the start of a fulfillment or adjustment process, before making
 *    any inventory deductions or status transitions.
 *  - Must be executed inside an active transaction to hold locks consistently.
 *
 * @async
 * @function getAndLockAllocations
 * @param {string} orderId - The ID of the order whose allocations are being fulfilled
 * @param {string[]|null} [allocationIds=null] - Optional list of allocation IDs to filter;
 *                                               if null, all allocations for the order are fetched
 * @param {Object} client - Database client/transaction context
 * @returns {Promise<{ allocationMeta: Object[], warehouseBatchKeys: Object[] }>}
 *  allocationMeta - List of allocations with IDs, warehouse_id, batch_id, and quantities
 *  warehouseBatchKeys - Array of `{ warehouse_id, batch_id }` pairs used for locking
 *
 * @throws {AppError} If allocations are invalid or lock acquisition fails
 */
const getAndLockAllocations = async (orderId, allocationIds = null, client) => {
  const allocationMeta = await getAllocationsByOrderId(orderId, allocationIds, client);
  
  assertAllocationsValid(allocationMeta);
  
  const lockConditions = allocationMeta.map(({ batch_id, warehouse_id }) => ({
    warehouse_id: warehouse_id,
    batch_id: batch_id,
  }));
  
  await lockRows(client, 'warehouse_inventory', lockConditions, 'FOR UPDATE', {
    traceId: 'fulfillment',
    orderId,
  });
  
  return {
    allocationMeta,
    warehouseBatchKeys: lockConditions,
  };
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
 * Assert that order metadata is present and contains required fields.
 *
 * Business rule:
 *  - An order must have a valid `order_id` and `order_number` before it can be
 *    used in fulfillment or inventory adjustment workflows.
 *
 * @param {Object} orderMeta - Metadata object returned from repository/service
 * @param {string} orderMeta.order_id - Unique ID of the order
 * @param {string} orderMeta.order_number - Human-readable order number
 *
 * @throws {AppError} NotFoundError if metadata is missing or incomplete
 */
const assertOrderMeta = (orderMeta) => {
  if (!orderMeta || !orderMeta.order_id || !orderMeta.order_number) {
    throw AppError.notFoundError('Order metadata not found or invalid.');
  }
};

/**
 * Assert that fulfillments exist and contain valid references.
 *
 * Business rule:
 *  - Every fulfillment must reference both a `fulfillment_id` and `shipment_id`.
 *
 * @param {Array} fulfillments - Array of fulfillment records
 * @param {string} order_number - Order number for error context
 * @throws {AppError} NotFoundError if no fulfillments exist
 * @throws {AppError} ValidationError if required IDs are missing
 */
const assertFulfillmentsValid = (fulfillments = [], order_number) => {
  if (!Array.isArray(fulfillments) || fulfillments.length === 0) {
    throw AppError.notFoundError(`No fulfillments found for order: ${order_number}`);
  }
  
  fulfillments.forEach((f) => {
    if (!f.fulfillment_id) {
      throw AppError.validationError('Fulfillment missing fulfillment_id.');
    }
    if (!f.shipment_id) {
      throw AppError.validationError('Fulfillment missing shipment_id.');
    }
  });
};

/**
 * Assert that inventory coverage exists for allocations.
 *
 * Business rule:
 *  - Every allocation must have a corresponding inventory record
 *    in `warehouse_inventory`.
 *
 * @param {Array} inventoryMeta - Inventory rows fetched from `warehouse_inventory`
 * @throws {AppError} NotFoundError if no inventory records exist
 */
const assertInventoryCoverage = (inventoryMeta = []) => {
  if (!Array.isArray(inventoryMeta) || inventoryMeta.length === 0) {
    throw AppError.notFoundError('No inventory records found for allocations.');
  }
};

/**
 * Assert that enriched allocations contain valid inventory data.
 *
 * Business rule:
 *  - Enriched allocations must include `available_quantity` and `allocated_quantity`
 *    for accurate adjustment calculations.
 *
 * @param {Array} enrichedAllocations - Array of enriched allocation objects
 * @throws {AppError} BusinessError if no enriched allocations are provided
 * @throws {AppError} ValidationError if required fields are missing
 */
const assertEnrichedAllocations = (enrichedAllocations = []) => {
  if (!Array.isArray(enrichedAllocations) || enrichedAllocations.length === 0) {
    throw AppError.businessError('Enriched allocations are empty.');
  }
  
  enrichedAllocations.forEach(a => {
    if (a.available_quantity == null || a.allocated_quantity == null) {
      throw AppError.validationError(
        'Enriched allocation missing required inventory fields.',
        { allocation: a }
      );
    }
  });
};

/**
 * Assert that inventory adjustments were calculated.
 *
 * Business rule:
 *  - Adjustment object must contain at least one warehouse/batch key
 *    with corresponding updates.
 *
 * @param {Object} updatesObject - Object mapping `{warehouse_id-batch_id}` → adjustments
 * @throws {AppError} BusinessError if adjustments are missing or invalid
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
 * Assert that warehouse inventory updates were applied.
 *
 * Business rule:
 *  - At least one `warehouse_inventory` row must be updated after adjustments.
 *
 * @param {Array} warehouseInventoryIds - IDs of updated warehouse inventory rows
 * @param {Object} [context={}] - Optional debug context (e.g. attempted updates)
 * @throws {AppError} BusinessError if no updates were applied
 */
const assertWarehouseUpdatesApplied = (warehouseInventoryIds = [], context = {}) => {
  if (!Array.isArray(warehouseInventoryIds) || warehouseInventoryIds.length === 0) {
    throw AppError.businessError(
      'No warehouse inventory records were updated during fulfillment adjustment.',
      context
    );
  }
};

/**
 * Assert that status IDs were successfully resolved.
 *
 * Business rule:
 *  - Order, shipment, and fulfillment statuses must all resolve to valid IDs
 *    before applying updates.
 *
 * @param {Object} ids - Status ID bundle
 * @param {string} ids.orderStatusId - Order status ID
 * @param {string} ids.shipmentStatusId - Shipment status ID
 * @param {string} ids.fulfillmentStatusId - Fulfillment status ID
 * @throws {AppError} ValidationError if any status ID is missing
 */
const assertStatusesResolved = ({ orderStatusId, shipmentStatusId, fulfillmentStatusId }) => {
  if (!orderStatusId || !shipmentStatusId || !fulfillmentStatusId) {
    throw AppError.validationError('Invalid or unresolved status codes.', {
      orderStatusId,
      shipmentStatusId,
      fulfillmentStatusId,
    });
  }
};

/**
 * Assert that an inventory action type ID was resolved.
 *
 * Business rule:
 *  - A valid inventory action type must exist for the given name
 *    (e.g., "fulfilled", "reserve").
 *
 * @param {string} inventoryActionTypeId - Resolved ID of the action type
 * @param {string} name - Action type name for error context
 * @throws {AppError} NotFoundError if no matching action type was found
 */
const assertActionTypeIdResolved = (inventoryActionTypeId, name) => {
  if (!inventoryActionTypeId) {
    throw AppError.notFoundError(
      `Inventory action type not found for name: ${name}`
    );
  }
};

/**
 * Assert that inventory activity logs were generated.
 *
 * Business rule:
 *  - At least one log entry must be created for auditing inventory adjustments.
 *
 * @param {Array<object>|{activityLogIds?: string[], insertedActivityCount?: number}} logs
 *    - Pre-insert: an array of log objects built in memory.
 *    - Post-insert: a metadata object returned from DB insert (with `activityLogIds`).
 * @param {string} [stage='logs'] - Stage label for error context (e.g. 'build', 'insert')
 * @throws {AppError} BusinessError if no logs are generated
 */
const assertLogsGenerated = (logs, stage = 'logs') => {
  if (Array.isArray(logs)) {
    if (logs.length === 0) {
      throw AppError.businessError(`No inventory activity logs generated at stage: ${stage}`);
    }
  } else if (logs && typeof logs === 'object') {
    if (!logs.activityLogIds || logs.activityLogIds.length === 0) {
      throw AppError.businessError(`No inventory activity logs inserted at stage: ${stage}`);
    }
  } else {
    throw AppError.businessError(`Invalid log structure at stage: ${stage}`);
  }
};

/**
 * Enriches allocation metadata with corresponding warehouse inventory details.
 *
 * Business rules:
 *  - Each allocation must be paired with its warehouse inventory record
 *    using `{ warehouse_id, batch_id }` as the composite key.
 *  - Adds derived `available_quantity = warehouse_quantity - reserved_quantity`.
 *  - Aliases inventory record ID → `warehouse_inventory_id`.
 *  - Copies `status_id` → `inventory_status_id` for clarity in downstream logic.
 *
 * Usage:
 *  - Call after fetching both allocation metadata and warehouse inventory records.
 *  - Prepares enriched allocation objects for inventory adjustments and audit logging.
 *
 * Performance:
 *  - Uses a lookup Map for O(n + m) matching (efficient for large datasets).
 *
 * @function
 * @param {Object[]} allocationMeta - List of allocation metadata objects
 * @param {string} allocationMeta[].allocation_id - Allocation record ID
 * @param {string} allocationMeta[].order_item_id - Order item ID
 * @param {string} allocationMeta[].warehouse_id - Warehouse ID of the allocation
 * @param {string} allocationMeta[].batch_id - Batch ID of the allocation
 * @param {number} allocationMeta[].allocated_quantity - Quantity allocated
 * @param {Object[]} inventoryMeta - List of warehouse inventory records
 * @param {string} inventoryMeta[].id - Warehouse inventory record ID
 * @param {string} inventoryMeta[].warehouse_id - Warehouse ID of the inventory record
 * @param {string} inventoryMeta[].batch_id - Batch ID of the inventory record
 * @param {number} inventoryMeta[].warehouse_quantity - Current warehouse quantity
 * @param {number} inventoryMeta[].reserved_quantity - Current reserved quantity
 * @param {string} inventoryMeta[].status_id - Current inventory status ID
 * @returns {Object[]} Enriched allocation objects including:
 *  - All original allocation fields
 *  - All matched inventory fields
 *  - `available_quantity` (derived)
 *  - `warehouse_inventory_id` (alias for inventory `id`)
 *  - `inventory_status_id` (alias for inventory `status_id`)
 */
const enrichAllocationsWithInventory = (allocationMeta, inventoryMeta) => {
  // Build lookup map: key = "warehouseId-batchId"
  const inventoryMap = new Map(
    inventoryMeta.map(i => [`${i.warehouse_id}-${i.batch_id}`, i])
  );
  
  // Enrich allocations using O(1) lookups
  return allocationMeta.map(a => {
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
          last_update: new Date(),
        },
      ];
    })
  );
};

/**
 * Update allocation statuses in bulk for a given order.
 *
 * Business rules:
 *  - All allocations must be locked (`FOR UPDATE`) before updating to prevent
 *    race conditions with concurrent fulfillment or adjustment processes.
 *  - Only valid allocation IDs will be updated; missing or invalid IDs will
 *    trigger an error at the repository layer.
 *
 * Workflow:
 *  1. Extract allocation IDs from `allocationMeta`.
 *  2. Acquire row-level locks on `inventory_allocations` for those IDs.
 *  3. Apply the new status to all locked allocations.
 *
 * @async
 * @function
 * @param {Array} allocationMeta - Allocation metadata containing `allocation_id`
 * @param {string} allocationStatusId - ID of the new allocation status
 * @param {string} orderId - ID of the order associated with allocations
 * @param {string} orderNumber - Human-readable order number (for logging/debugging)
 * @param {string} userId - ID of the user performing the update
 * @param {Object} client - Database client/transaction context
 * @returns {Promise<Array>} Updated allocation status rows
 *
 * @throws {AppError}
 *  - ValidationError: If allocation IDs are missing or invalid
 *  - DatabaseError: If locking or updating allocations fails
 */
const updateAllocationsStatusBusiness = async (allocationMeta, allocationStatusId, orderId, orderNumber, userId, client) => {
  const allocationIds = allocationMeta.map(a => a.allocation_id);

  // Lock allocations before updating to ensure consistency
  await lockRows(client, 'inventory_allocations', allocationIds, 'FOR UPDATE', {
    stage: 'allocation-status-update',
    orderId,
    orderNumber,
    userId,
  });
  
  return await updateInventoryAllocationStatus(
    {
      statusId: allocationStatusId,
      userId,
      allocationIds,
    },
    client
  );
};

/**
 * Update fulfillment statuses in bulk for a given order.
 *
 * Business rules:
 *  - All fulfillments must be locked (`FOR UPDATE`) before updating to prevent
 *    race conditions with concurrent adjustments or shipment updates.
 *  - Only valid fulfillment IDs will be updated; missing or invalid IDs will
 *    result in no changes.
 *
 * Workflow:
 *  1. Extract fulfillment IDs from the `fulfillments` array.
 *  2. Acquire row-level locks on `order_fulfillments`.
 *  3. Apply the new status to all locked fulfillments.
 *
 * @async
 * @function
 * @param {Array} fulfillments - Fulfillment records containing `fulfillment_id`
 * @param {string} newStatusId - ID of the new fulfillment status
 * @param {string} orderId - ID of the order associated with fulfillments
 * @param {string} orderNumber - Human-readable order number (for logging/debugging)
 * @param {string} userId - ID of the user performing the update
 * @param {Object} client - Database client/transaction context
 * @returns {Promise<Array>} Updated fulfillment status rows
 *
 * @throws {AppError}
 *  - ValidationError: If fulfillment IDs are missing or invalid
 *  - DatabaseError: If locking or updating fulfillments fails
 */
const updateFulfillmentsStatusBusiness = async (fulfillments, newStatusId, orderId, orderNumber, userId, client) => {
  const fulfillmentIds = fulfillments.map(f => f.fulfillment_id).filter(Boolean);
  if (!fulfillmentIds.length || !newStatusId) return [];
  
  await lockRows(client, 'order_fulfillments', fulfillmentIds, 'FOR UPDATE', {
    stage: 'fulfillment-status-update',
    orderId,
    orderNumber,
    userId,
  });
  
  return await updateOrderFulfillmentStatus(
    {
      statusId: newStatusId,
      userId,
      fulfillmentIds,
    },
    client
  );
};

/**
 * Update shipment statuses in bulk for a given order.
 *
 * Business rules:
 *  - All shipments must be locked (`FOR UPDATE`) before updating to prevent
 *    race conditions with concurrent fulfillment or adjustment processes.
 *  - Only valid shipment IDs will be updated; missing or invalid IDs will
 *    result in no changes.
 *
 * Workflow:
 *  1. Extract shipment IDs from the `fulfillments` array.
 *  2. Acquire row-level locks on `outbound_shipments`.
 *  3. Apply the new status to all locked shipments.
 *
 * @async
 * @function
 * @param {Array} fulfillments - Fulfillment records containing `shipment_id`
 * @param {string} newStatusId - ID of the new shipment status
 * @param {string} orderId - ID of the order associated with shipments
 * @param {string} orderNumber - Human-readable order number (for logging/debugging)
 * @param {string} userId - ID of the user performing the update
 * @param {Object} client - Database client/transaction context
 * @returns {Promise<Array>} Updated shipment status rows
 *
 * @throws {AppError}
 *  - ValidationError: If shipment IDs are missing or invalid
 *  - DatabaseError: If locking or updating shipments fails
 */
const updateShipmentsStatusBusiness = async (fulfillments, newStatusId, orderId, orderNumber, userId, client) => {
  const shipmentIds = fulfillments.map(f => f.shipment_id).filter(Boolean);
  if (!shipmentIds.length || !newStatusId) return [];
  
  await lockRows(client, 'outbound_shipments', shipmentIds, 'FOR UPDATE', {
    stage: 'shipment-status-update',
    orderId,
    orderNumber,
    userId,
  });
  
  return await updateOutboundShipmentStatus(
    {
      statusId: newStatusId,
      userId,
      shipmentIds,
    },
    client
  );
};

/**
 * Updates statuses for all entities involved in fulfillment:
 * - Order
 * - Order Items
 * - Allocations
 * - Fulfillments
 * - Shipments
 *
 * Business rules:
 *  - The order and all its items transition together to the same new status (e.g., `ORDER_PROCESSING`).
 *  - Allocations transition if allocation metadata and a new allocation status ID are provided.
 *  - Fulfillments and shipments transition only if fulfillments are provided AND new status IDs are specified.
 *  - Allocation, fulfillment, and shipment rows should be row-locked upstream to avoid concurrency issues.
 *
 * Usage:
 *  - Call during fulfillment adjustment or shipment processing after inventory changes are staged.
 *  - Ensures all related statuses remain synchronized in a single transactional step.
 *
 * Performance:
 *  - O(n) complexity for mapping allocation/fulfillment/shipment IDs.
 *  - Executes up to 5 DB updates (order, order items, allocations, fulfillments, shipments).
 *  - Row locking applied to allocations, fulfillments, and shipments for safety.
 *
 * @async
 * @function
 * @param {Object} params
 * @param {string} params.orderId - ID of the order being updated
 * @param {string} params.orderNumber - Human-readable order number (for logging/context)
 * @param {Object[]} [params.allocationMeta=[]] - Allocation metadata objects to update
 * @param {string} params.newOrderStatusId - New status ID for the order and its items
 * @param {string} [params.newAllocationStatusId] - New status ID for allocations
 * @param {Object[]} [params.fulfillments=[]] - Fulfillment metadata objects to update
 * @param {string} [params.newFulfillmentStatusId] - New status ID for fulfillments
 * @param {string} [params.newShipmentStatusId] - New status ID for shipments
 * @param {string} params.userId - ID of the user performing the update
 * @param {Object} params.client - Database client/transaction context
 *
 * @returns {Promise<Object>} Updated rows grouped by entity:
 *  - {Object}   orderStatusRow              Updated order row
 *  - {Object[]} orderItemStatusRow          Updated order item rows
 *  - {Object[]} inventoryAllocationStatusRow Updated allocation rows
 *  - {Object[]} orderFulfillmentStatusRow   Updated fulfillment rows
 *  - {Object[]} shipmentStatusRow           Updated shipment rows
 *
 * @throws {AppError} If any required update fails
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
  // --- 1. Update Order status
  const orderStatusRow = await updateOrderStatus(client, {
    orderId,
    newStatusId: newOrderStatusId,
    updatedBy: userId,
  });
  
  // --- 2. Update all Order Item statuses (all items under the order)
  const orderItemStatusRow = await updateOrderItemStatusesByOrderId(client, {
    orderId,
    newStatusId: newOrderStatusId,
    updatedBy: userId,
  });
  
  // --- 3. Update Allocation statuses if allocations provided
  const inventoryAllocationStatusRow =
    allocationMeta.length && newAllocationStatusId
      ? await updateAllocationsStatusBusiness(
        allocationMeta,
        newAllocationStatusId,
        orderId,
        orderNumber,
        userId,
        client
      )
      : [];
  
  // --- 4. Update Fulfillment statuses if fulfillments and new status provided
  const orderFulfillmentStatusRow =
    fulfillments.length && newFulfillmentStatusId
      ? await updateFulfillmentsStatusBusiness(
        fulfillments,
        newFulfillmentStatusId,
        orderId,
        orderNumber,
        userId,
        client
      )
      : [];
  
  // --- 5. Update Shipment statuses if fulfillments and new status provided
  const shipmentStatusRow =
    fulfillments.length && newShipmentStatusId
      ? await updateShipmentsStatusBusiness(
        fulfillments,
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
 * Builds a single inventory activity log entry for a fulfillment event.
 *
 * Business rules:
 *  - Every fulfillment that adjusts warehouse inventory must generate a log entry
 *    for auditing, traceability, and reconciliation.
 *  - Records before/after reserved and warehouse quantities alongside allocation,
 *    shipment, and fulfillment references.
 *  - Computes a checksum over the critical fields to ensure integrity.
 *
 * Usage:
 *  - Call inside fulfillment services (e.g., adjustInventoryForFulfillmentService).
 *  - Insert the returned object into `inventory_activity_log`.
 *
 * Performance:
 *  - O(1): constructs a single log object.
 *  - Optimized: uses `cleanObject` to strip null/undefined fields.
 *
 * @function
 * @param {Object} params - Parameters for building the log entry
 * @param {Object} params.allocation - Allocation metadata
 * @param {Object} params.update - Inventory update object
 * @param {string} params.inventoryActionTypeId - Action type ID (e.g., fulfillment)
 * @param {string} params.userId - ID of the user performing the operation
 * @param {string} params.orderId - ID of the order being fulfilled
 * @param {string} params.shipmentId - ID of the outbound shipment
 * @param {string} params.fulfillmentId - ID of the fulfillment record
 * @param {string} params.orderNumber - Human-readable order number
 *
 * @returns {Object} Log entry object including:
 *  - `warehouse_inventory_id`: Target warehouse inventory
 *  - `previous_quantity`, `quantity_change`, `new_quantity`
 *  - `metadata`: Allocation, batch, shipment, and reserved quantity details
 *  - `inventory_action_type_id`, `order_id`, `status_id`
 *  - `comments`: System-generated fulfillment context
 *  - `checksum`: Integrity hash for validation
 *
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
                                    orderNumber
                                  }) => {
  const previous_quantity = allocation.warehouse_quantity;
  const quantity_change = -allocation.allocated_quantity;
  const new_quantity = update.warehouse_quantity;
  const comments = `[System] Inventory adjusted during fulfillment for order ${orderNumber}`;
  
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
 * Builds a set of inventory activity log entries for a batch of allocations.
 *
 * Business rules:
 *  - Each allocation consumed during fulfillment must generate a log entry.
 *  - Delegates per-allocation log construction to `buildFulfillmentLogEntry` for consistency.
 *  - Matches each allocation with its computed inventory update from `updatesObject`.
 *
 * Usage:
 *  - Call after computing inventory adjustments (`calculateInventoryAdjustments`).
 *  - Use the returned array directly in `insertInventoryActivityLogs`.
 *
 * Performance:
 *  - O(n), where n = number of allocations.
 *  - Efficient: single pass, O(1) lookup in `updatesObject` using composite key `warehouse_id-batch_id`.
 *
 * @function
 * @param {Object[]} allocations - List of allocation objects (ideally enriched with inventory data)
 * @param {Object} updatesObject - Map of inventory update deltas keyed by `${warehouse_id}-${batch_id}`
 * @param {Object} options - Context for log building
 * @param {string} options.inventoryActionTypeId - Inventory action type ID (e.g., fulfillment)
 * @param {string} options.userId - ID of the user performing the operation
 * @param {string} options.orderId - ID of the order being fulfilled
 * @param {string} options.shipmentId - ID of the outbound shipment
 * @param {string} options.fulfillmentId - ID of the fulfillment record
 * @param {string} options.orderNumber - Human-readable order number
 *
 * @returns {Object[]} Array of inventory activity log entries, ready for DB insertion.
 *   Each entry includes fields like:
 *    - `warehouse_inventory_id`
 *    - `order_id`
 *    - `status_id`
 *    - `quantity_change`
 *    - `new_quantity`
 *    - `comments`
 *    - `metadata` (batch, allocation, shipment, fulfillment context)
 *
 * @example
 * buildInventoryActivityLogs(enrichedAllocations, updatesObject, {
 *   inventoryActionTypeId: "fulfillment",
 *   userId: "user-123",
 *   orderId: "order-456",
 *   shipmentId: "ship-789",
 *   fulfillmentId: "fulfill-000",
 *   orderNumber: "SO-2025-0001"
 * });
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
) => {
  return allocations.map(a =>
    buildFulfillmentLogEntry({
      allocation: a,
      update: updatesObject[`${a.warehouse_id}-${a.batch_id}`],
      inventoryActionTypeId,
      userId,
      orderId,
      shipmentId,
      fulfillmentId,
      orderNumber,
    })
  );
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
  assertInventoryCoverage,
  assertEnrichedAllocations,
  assertInventoryAdjustments,
  assertWarehouseUpdatesApplied,
  assertStatusesResolved,
  assertActionTypeIdResolved,
  assertLogsGenerated,
  enrichAllocationsWithInventory,
  calculateInventoryAdjustments,
  updateAllStatuses,
  buildFulfillmentLogEntry,
  buildInventoryActivityLogs,
};
