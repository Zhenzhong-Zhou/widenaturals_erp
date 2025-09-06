/**
 * @typedef {Object} Batch
 * @property {string} batch_id
 * @property {number} warehouse_quantity
 * @property {number} reserved_quantity
 * @property {string|Date} expiry_date
 * @property {any} [key] - Additional metadata like sku_id, warehouse_id, etc.
 */

/**
 * @typedef {Batch & { allocated_quantity: number }} AllocatedBatch
 */

const { cleanObject } = require('../utils/object-utils');
const { generateChecksum } = require('../utils/crypto-utils');

/**
 * Allocates inventory batches for each order item using the specified strategy (FEFO or FIFO).
 *
 * This function applies pure domain logic only — it performs no database operations or logging.
 * It maps each order item to a set of batches from the given input, choosing those that best fulfill
 * the requested quantity using the chosen strategy (default: FEFO).
 *
 * @param {Array<{
 *   order_item_id: string,
 *   sku_id?: string | null,
 *   packaging_material_id?: string | null,
 *   quantity_ordered: number
 * }>} orderItems - List of order items needing allocation.
 *
 * @param {Array<{
 *   batch_id: string,
 *   warehouse_id: string,
 *   warehouse_quantity: number,
 *   reserved_quantity?: number,
 *   expiry_date?: string | Date,
 *   inbound_date?: string | Date,
 *   sku_id?: string | null,
 *   packaging_material_id?: string | null
 * }>} batches - All available batches with relevant metadata.
 *
 * @param {'fefo' | 'fifo'} [strategy='fefo'] - Allocation strategy:
 *   - 'fefo': First Expiry, First Out
 *   - 'fifo': First Inbound, First Out
 *
 * @returns {Array<{
 *   order_item_id: string,
 *   sku_id: string | null,
 *   packaging_material_id: string | null,
 *   quantity_ordered: number,
 *   allocated: {
 *     allocatedBatches: Array<Object>,
 *     allocatedTotal: number,
 *     remaining: number,
 *     fulfilled: boolean
 *   }
 * }>} Allocation result for each order item.
 */
const allocateBatchesForOrderItems = (orderItems, batches, strategy = 'fefo') => {
  // Build indexes to avoid N×M filtering
  const bySku = new Map();
  const byMat = new Map();
  
  for (const b of batches || []) {
    if (b && b.sku_id) {
      if (!bySku.has(b.sku_id)) bySku.set(b.sku_id, []);
      bySku.get(b.sku_id).push(b);
    }
    if (b && b.packaging_material_id) {
      if (!byMat.has(b.packaging_material_id)) byMat.set(b.packaging_material_id, []);
      byMat.get(b.packaging_material_id).push(b);
    }
  }
  
  return (orderItems || []).map((item) => {
    const { order_item_id, sku_id, packaging_material_id, quantity_ordered } = item;
    
    const candidates = sku_id
      ? (bySku.get(sku_id) || [])
      : packaging_material_id
        ? (byMat.get(packaging_material_id) || [])
        : [];
    
    const { allocatedBatches, allocatedTotal, remaining, fulfilled } =
      allocateBatchesByStrategy(candidates, quantity_ordered, { strategy });
    
    return {
      order_item_id,
      sku_id: sku_id ?? null,
      packaging_material_id: packaging_material_id ?? null,
      quantity_ordered,
      allocated: { allocatedBatches, allocatedTotal, remaining, fulfilled },
    };
  });
};

/**
 * Allocate inventory from batches using a strategy (FEFO/FIFO), accumulating across batches.
 *
 * Strategy:
 *  - 'fefo' => sort by expiry_date ASC
 *  - 'fifo' => sort by inbound_date ASC
 *
 * Edge cases handled:
 *  - Uses available = warehouse_quantity - reserved_quantity (clamped at 0)
 *  - Skips batches with no availability
 *  - Can optionally exclude expired batches
 *  - Returns meta: total allocated, remaining, fulfilled flag
 *
 * @param {Array<Object>} batches - Each batch should include:
 *   - warehouse_quantity: number
 *   - reserved_quantity?: number
 *   - expiry_date?: string|Date   (for FEFO)
 *   - inbound_date?: string|Date  (for FIFO)
 *   - other identifying fields (batch_id, warehouse_id, sku_id / packaging_material_id)
 * @param {number} requiredQuantity - Quantity requested
 * @param {Object} [options]
 * @param {'fefo'|'fifo'} [options.strategy='fefo']
 * @param {boolean} [options.excludeExpired=false] - If true, drop batches with expiry_date < now (FEFO only)
 * @param {Date} [options.now=new Date()] - Reference time for expiry checks
 * @returns {{
 *   allocatedBatches: Array<Object>, // original batch fields + allocated_quantity
 *   allocatedTotal: number,
 *   remaining: number,
 *   fulfilled: boolean
 * }}
 */
const allocateBatchesByStrategy = (
  batches,
  requiredQuantity,
  { strategy = 'fefo', excludeExpired = false, now = new Date() } = {}
) => {
  if (!Array.isArray(batches) || requiredQuantity <= 0) {
    return { allocatedBatches: [], allocatedTotal: 0, remaining: Math.max(0, requiredQuantity || 0), fulfilled: false };
  }
  
  const sortField = strategy === 'fifo' ? 'inbound_date' : 'expiry_date';
  
  // Normalize/prepare list
  let candidates = batches
    .map(b => {
      const reserved = Math.max(0, Number(b.reserved_quantity || 0));
      const qty = Math.max(0, Number(b.warehouse_quantity || 0) - reserved);
      return { ...b, _available: qty };
    })
    .filter(b => b._available > 0);
  
  // Optional: exclude expired for FEFO
  if (excludeExpired && sortField === 'expiry_date') {
    candidates = candidates.filter(b => b.expiry_date && new Date(b.expiry_date) >= now);
  }
  
  // Sort by strategy field; push records with missing sortField to the end
  candidates.sort((a, b) => {
    const da = a[sortField] ? new Date(a[sortField]).getTime() : Number.POSITIVE_INFINITY;
    const db = b[sortField] ? new Date(b[sortField]).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });
  
  const allocatedBatches = [];
  let accumulated = 0;
  
  for (const batch of candidates) {
    if (accumulated >= requiredQuantity) break;
    const needed = requiredQuantity - accumulated;
    const take = Math.min(batch._available, needed);
    if (take <= 0) continue;
    
    // Emit allocation row
    allocatedBatches.push({
      ...batch,
      allocated_quantity: take,
    });
    
    accumulated += take;
  }
  
  const allocatedTotal = accumulated;
  const remaining = Math.max(0, requiredQuantity - allocatedTotal);
  const fulfilled = remaining === 0;
  
  return {
    allocatedBatches,
    allocatedTotal,
    remaining,
    fulfilled,
    partial: !fulfilled && allocatedTotal > 0, // Optional field
  };
};

/**
 * Computes the allocation status for each order item based on total allocated quantity.
 *
 * For every order item, this function calculates how much quantity has been allocated
 * across all associated inventory batches. It compares the allocated quantity
 * against the ordered quantity and determines the appropriate allocation status:
 *
 * - `ORDER_ALLOCATED`: Fully allocated (allocatedQty === orderedQty)
 * - `ORDER_PARTIALLY_ALLOCATED`: Partially fulfilled (allocatedQty > 0 && < orderedQty)
 * - `ORDER_BACKORDERED`: No allocation yet (allocatedQty === 0)
 *
 * This is commonly used after batch-level allocation to determine order-level progress.
 *
 * @param {Array<{
 *   order_item_id: string,
 *   quantity_ordered: number
 * }>} orderItemsMetadata - Array of order item metadata including ordered quantity.
 *
 * @param {Array<{
 *   order_item_id: string,
 *   allocated_quantity: number
 * }>} inventoryAllocationDetails - Allocation records including order item references and allocated quantities.
 *
 * @returns {Array<{
 *   orderItemId: string,
 *   orderedQty: number,
 *   allocatedQty: number,
 *   isMatched: boolean,
 *   allocationStatus: 'ORDER_ALLOCATED' | 'ORDER_PARTIALLY_ALLOCATED' | 'ORDER_BACKORDERED'
 * }>} Summary of allocation status per order item.
 */
const computeAllocationStatusPerItem = (orderItemsMetadata, inventoryAllocationDetails) => {
  // Aggregate total allocated quantity by order_item_id
  const allocationMap = inventoryAllocationDetails.reduce((acc, row) => {
    const key = row.order_item_id;
    acc[key] = (acc[key] || 0) + Number(row.allocated_quantity);
    return acc;
  }, {});
  
  return orderItemsMetadata.map((item) => {
    const orderItemId = item.order_item_id;
    const orderedQty = Number(item.quantity_ordered || 0);
    const allocatedQty = allocationMap[orderItemId] || 0;
    
    let allocationStatusCode;
    
    if (allocatedQty === 0) {
      allocationStatusCode = 'ORDER_BACKORDERED';
    } else if (allocatedQty < orderedQty) {
      allocationStatusCode = 'ORDER_PARTIALLY_ALLOCATED';
    } else {
      allocationStatusCode = 'ORDER_ALLOCATED';
    }
    
    const isMatched = allocatedQty === orderedQty;
    
    return {
      orderItemId,
      isMatched,
      allocatedQty,
      orderedQty,
      allocationStatus: allocationStatusCode,
    };
  });
};

/**
 * Recalculates and updates reserved quantities in `warehouse_inventory` based on confirmed allocations.
 *
 * This function:
 * 1. Aggregates total allocated quantities by (warehouse_id + batch_id).
 * 2. Adds these to the existing reserved quantities for each inventory record.
 * 3. Recalculates the available quantity (warehouse_quantity - reserved_quantity).
 * 4. Updates the inventory `status_id` based on whether there is available stock.
 *
 * The function returns a list of records formatted for bulk update.
 *
 * @param {Array<{
 *   warehouse_id: string,
 *   batch_id: string,
 *   allocated_quantity: number
 * }>} allocations - Confirmed inventory allocations per batch and warehouse.
 *
 * @param {Array<{
 *   warehouse_id: string,
 *   batch_id: string,
 *   warehouse_quantity: number,
 *   reserved_quantity: number
 * }>} warehouseBatchInfo - Current inventory records per warehouse-batch pair.
 *
 * @param {{
 *   inStockStatusId: string,
 *   outOfStockStatusId: string
 * }} statusIds - Inventory status IDs to apply based on availability.
 *
 * @returns {Array<{
 *   warehouse_id: string,
 *   batch_id: string,
 *   warehouse_quantity: number,
 *   reserved_quantity: number,
 *   status_id: string
 * }>} Updated inventory records ready for bulk update.
 */
const updateReservedQuantitiesFromAllocations = (
  allocations,
  warehouseBatchInfo,
  { inStockStatusId, outOfStockStatusId }
) => {
  // Step 1: Aggregate total allocated quantities by (warehouse_id + batch_id)
  const allocationMap = {};
  
  for (const { warehouse_id, batch_id, allocated_quantity } of allocations) {
    const key = `${warehouse_id}__${batch_id}`;
    allocationMap[key] = (allocationMap[key] || 0) + Number(allocated_quantity);
  }
  
  // Step 2: Update each warehouse record with new reserved qty and recalculate status
  return warehouseBatchInfo.map((record) => {
    const key = `${record.warehouse_id}__${record.batch_id}`;
    const newlyAllocated = allocationMap[key] || 0;
    
    const currentReservedQty = Number(record.reserved_quantity || 0);
    const newReservedQty = currentReservedQty + newlyAllocated;
    
    const availableQty = record.warehouse_quantity - newReservedQty;
    const status_id = availableQty > 0 ? inStockStatusId : outOfStockStatusId;
    
    return {
      warehouse_id: record.warehouse_id,
      batch_id: record.batch_id,
      warehouse_quantity: record.warehouse_quantity, // keep as-is
      reserved_quantity: newReservedQty,
      status_id,
    };
  });
};

/**
 * Builds structured inventory activity log entries from allocation updates for a sales order.
 *
 * This function compares the `reserved_quantity` values before and after allocation
 * and generates a log entry for each changed inventory record (by warehouse + batch).
 * These logs are used to track inventory reservation actions tied to sales orders.
 *
 * The resulting logs are suitable for direct insertion via `insertInventoryActivityLogs`.
 *
 * @param {Array<{
 *   warehouse_id: string,
 *   batch_id: string,
 *   warehouse_quantity: number,
 *   reserved_quantity: number,
 *   status_id: string
 * }>} updatedRows - Output from `updateReservedQuantitiesFromAllocations`, reflecting new state.
 *
 * @param {Array<{
 *   id: string,
 *   warehouse_id: string,
 *   batch_id: string,
 *   reserved_quantity: number
 * }>} originalWarehouseInfo - Snapshot of the warehouse inventory records before allocation.
 *
 * @param {{
 *   orderId: string,              // Sales order ID (used as `sourceRefId`)
 *   performedBy: string,          // ID of the user performing the allocation
 *   actionTypeId: string,         // Inventory action type (e.g., 'reserve', 'allocate')
 *   comments?: string             // Optional comment to include in each log entry
 * }} options - Contextual data for generating audit logs.
 *
 * @returns {Array<Object>} Array of inventory activity log objects to insert.
 *
 * @throws {Error} If any updated row is missing a corresponding original record.
 */
const buildWarehouseInventoryActivityLogsForOrderAllocation = (
  updatedRows,
  originalWarehouseInfo,
  {
    orderId,
    performedBy,
    actionTypeId,
    comments = null,
  }
) => {
  const originalMap = Object.fromEntries(
    originalWarehouseInfo.map((record) => [
      `${record.warehouse_id}__${record.batch_id}`,
      record,
    ])
  );
  
  return updatedRows.map((updated) => {
    const key = `${updated.warehouse_id}__${updated.batch_id}`;
    const original = originalMap[key];
    
    if (!original) {
      throw new Error(`Missing original data for ${key}`);
    }
    
    return buildAllocationLogEntry({
      inventoryId: original.id,
      previousReservedQty: original.reserved_quantity,
      newReservedQty: updated.reserved_quantity,
      warehouseQty: updated.warehouse_quantity,
      statusId: updated.status_id,
      userId: performedBy,
      orderId,
      inventoryActionTypeId: actionTypeId,
      sourceType: 'order',
      sourceRefId: orderId,
      recordScope: 'warehouse',
      comments: comments ?? `System-generated log: reserved quantity updated during allocation`,
      metadata: {
        source: 'order_allocation',
        warehouse_id: updated.warehouse_id,
        batch_id: updated.batch_id,
      },
    });
  });
};

/**
 * Builds a structured log entry object for an inventory allocation event.
 *
 * This function is used to record allocation-related changes to the `reserved_quantity`
 * field in the `warehouse_inventory` table. It computes the quantity change, builds a
 * metadata object with contextual details, and generates a checksum to ensure log integrity.
 *
 * The returned object is ready for insertion into the inventory activity log table.
 *
 * @param {Object} params - Allocation log parameters.
 * @param {string} params.inventoryId - The ID of the warehouse inventory record.
 * @param {number} params.previousReservedQty - The previous reserved quantity.
 * @param {number} params.newReservedQty - The updated reserved quantity after allocation.
 * @param {number} params.warehouseQty - The current warehouse quantity (for snapshot only).
 * @param {string} params.statusId - Inventory status ID after allocation.
 * @param {string} params.userId - The ID of the user performing the allocation.
 * @param {string} params.orderId - The ID of the related order (if applicable).
 * @param {string} params.inventoryActionTypeId - ID of the action type (e.g., "ALLOCATE").
 * @param {string} [params.sourceType='order'] - Source of the change (e.g., 'order', 'manual').
 * @param {string|null} [params.sourceRefId=null] - Reference ID from the source context.
 * @param {string} [params.recordScope='warehouse'] - Scope of the record ('warehouse' or 'location').
 * @param {string|null} [params.comments=null] - Optional comment describing the action.
 * @param {object} [params.metadata={}] - Additional metadata for traceability.
 *
 * @returns {object} Inventory activity log object with checksum and full context.
 */
const buildAllocationLogEntry = ({
                                   inventoryId,
                                   previousReservedQty,
                                   newReservedQty,
                                   warehouseQty, // unchanged but included for reference
                                   statusId,
                                   userId,
                                   orderId,
                                   inventoryActionTypeId, // e.g., 'ALLOCATE'
                                   sourceType = 'order',
                                   sourceRefId = null,
                                   recordScope = 'warehouse',
                                   comments = null,
                                   metadata = {},
                                 }) => {
  const quantityChange = newReservedQty - previousReservedQty;
  
  const checksumPayload = cleanObject({
    warehouse_inventory_id: inventoryId,
    inventory_action_type_id: inventoryActionTypeId,
    adjustment_type_id: null, // not an adjustment
    order_id: orderId || null,
    quantity_change: quantityChange,
    new_quantity: newReservedQty,
    status_id: statusId,
    performed_by: userId,
    comments,
    recorded_by: userId,
    inventory_scope: recordScope,
    source_type: sourceType,
    source_ref_id: sourceRefId,
    metadata: {
      action: 'allocate',
      warehouse_quantity_snapshot: warehouseQty,
      record_scope: recordScope,
      ...metadata,
    },
  });
  
  return {
    warehouse_inventory_id: inventoryId,
    inventory_action_type_id: inventoryActionTypeId,
    adjustment_type_id: null,
    order_id: orderId || null,
    previous_quantity: previousReservedQty,
    quantity_change: quantityChange,
    new_quantity: newReservedQty,
    status_id: statusId,
    performed_by: userId,
    recorded_by: userId,
    comments,
    metadata: checksumPayload.metadata,
    source_type: sourceType,
    source_ref_id: sourceRefId,
    inventory_scope: recordScope,
    checksum: generateChecksum(checksumPayload),
  };
};

/**
 * Constructs a structured result object summarizing the outcome of a sales order allocation operation.
 *
 * This function aggregates allocation-related information, including:
 * - Allocation IDs created or updated
 * - Warehouse inventory IDs affected by reservation updates
 * - Activity log IDs generated
 * - Whether the order is fully allocated
 * - Per-item allocation status and fulfillment match
 *
 * This is typically used as a business-layer output before transforming the response
 * into a client-facing format (e.g., via transformer).
 *
 * @param {{
 *   orderId: string,
 *   inventoryAllocations: Array<{
 *     allocation_id: string
 *   }>,
 *   warehouseUpdateIds: Array<{
 *     id: string
 *   }>,
 *   inventoryLogIds: string[], // IDs from activity log insert
 *   allocationResults: Array<{
 *     orderItemId: string,
 *     allocationStatus: 'ORDER_ALLOCATED' | 'ORDER_PARTIALLY_ALLOCATED' | 'ORDER_BACKORDERED',
 *     isMatched: boolean
 *   }>
 * }} params - All input data needed to construct the result.
 *
 * @returns {{
 *   orderId: string,
 *   allocationIds: string[],
 *   updatedWarehouseInventoryIds: string[],
 *   logIds: string[],
 *   fullyAllocated: boolean,
 *   updatedItemStatuses: Array<{
 *     orderItemId: string,
 *     newStatus: string,
 *     isFullyAllocated: boolean
 *   }>
 * }} Allocation summary result object.
 */
const buildOrderAllocationResult = ({
                                      orderId,
                                      inventoryAllocations,
                                      warehouseUpdateIds,
                                      inventoryLogIds,
                                      allocationResults,
                                    }) => {
  const fullyAllocated = allocationResults.every((res) => res.isMatched);
  
  return {
    orderId,
    allocationIds: inventoryAllocations.map((a) => a.allocation_id),
    updatedWarehouseInventoryIds: warehouseUpdateIds.map((r) => r.id),
    logIds: inventoryLogIds,
    fullyAllocated,
    updatedItemStatuses: allocationResults.map((res) => ({
      orderItemId: res.orderItemId,
      newStatus: res.allocationStatus,
      isFullyAllocated: res.isMatched,
    })),
  };
};

module.exports = {
  allocateBatchesForOrderItems,
  allocateBatchesByStrategy,
  computeAllocationStatusPerItem,
  updateReservedQuantitiesFromAllocations,
  buildWarehouseInventoryActivityLogsForOrderAllocation,
  buildAllocationLogEntry,
  buildOrderAllocationResult,
};
