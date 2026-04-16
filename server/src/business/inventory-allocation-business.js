/**
 * @file inventory-allocation-business.js
 * @description Pure domain business logic for the inventory allocation lifecycle.
 *
 * Covers:
 *   - Warehouse visibility evaluation and ACL filter injection
 *   - Batch allocation engine (FEFO / FIFO strategies)
 *   - Order item display resolution for error messages and logs
 *   - Allocation status transition validation
 *   - Per-item allocation status computation
 *   - Reserved quantity updates and inventory status recalculation
 *   - Warehouse-batch key deduplication for row locking
 *   - Allocation result construction for service-layer output
 *
 * All functions are pure or async-pure (no side effects beyond DB reads in
 * evaluateInventoryAllocationVisibility). No logging, no AppError wrapping
 * beyond domain validation errors, no transformer calls.
 */

'use strict';

const { resolveUserPermissionContext }   = require('../services/permission-service');
const { WAREHOUSE_INVENTORY_CONSTANTS }  = require('../utils/constants/domain/warehouse-inventory');
const { INVENTORY_ALLOCATION_CONSTANTS } = require('../utils/constants/domain/inventory-allocation');
const { getWarehouseIdsByUserId }        = require('../repositories/user-warehouse-assignment-repository');
const { logSystemException }             = require('../utils/logging/system-logger');
const AppError                           = require('../utils/AppError');
const { getProductDisplayName }          = require('../utils/display-name-utils');

const CONTEXT = 'inventory-allocation-business';

// ─── Visibility & ACL ────────────────────────────────────────────────────────

/**
 * Evaluates warehouse visibility scope for a user in the allocation domain.
 *
 * Users with `VIEW_ALL_WAREHOUSES` or `VIEW_ALL_ALLOCATIONS` permission (or root)
 * receive unrestricted access. All others are scoped to their assigned warehouses.
 *
 * @param {object} user           - Authenticated user (requires `id` and resolved permissions).
 * @returns {Promise<InventoryAllocationVisibilityAcl>}
 *
 * @throws {AppError} `businessError` — if permission resolution or warehouse lookup fails.
 */
const evaluateInventoryAllocationVisibility = async (user) => {
  const context = `${CONTEXT}/evaluateInventoryAllocationVisibility`;
  
  try {
    const { permissions, isRoot } = await resolveUserPermissionContext(user);
    
    const canViewAllWarehouses =
      isRoot ||
      permissions.includes(WAREHOUSE_INVENTORY_CONSTANTS.PERMISSIONS.VIEW_ALL_WAREHOUSES) ||
      permissions.includes(INVENTORY_ALLOCATION_CONSTANTS.PERMISSIONS.VIEW_ALL_ALLOCATIONS);
    
    // Only fetch assigned warehouses when the user is not globally privileged.
    const assignedWarehouseIds = canViewAllWarehouses
      ? null
      : await getWarehouseIdsByUserId(user.id);
    
    return {
      canViewAllWarehouses,
      assignedWarehouseIds,
    };
  } catch (err) {
    logSystemException(err, 'Failed to evaluate inventory allocation visibility', {
      context,
      userId: user?.id,
    });
    
    throw AppError.businessError(
      'Unable to evaluate inventory allocation visibility.'
    );
  }
};

/**
 * Applies ACL-driven warehouse visibility rules to an allocation filter object.
 *
 * Evaluation order:
 *  1. Unrestricted users — filters returned unchanged.
 *  2. User supplied specific warehouseIds — intersect with assigned warehouses.
 *     If intersection is empty, forceEmptyResult is set to short-circuit the query.
 *  3. No warehouse filter supplied — inject assigned warehouses as the filter.
 *
 * @param {AllocationVisibilityFilters}      filters  - Raw filters from the request.
 * @param {InventoryAllocationVisibilityAcl} acl      - Resolved ACL from evaluateInventoryAllocationVisibility.
 * @returns {AllocationVisibilityFilters} Adjusted filter object with warehouse scope applied.
 */
const applyInventoryAllocationVisibilityRules = (filters, acl) => {
  const adjusted = { ...filters };
  
  // Unrestricted — return filters unchanged.
  if (acl.canViewAllWarehouses) return adjusted;
  
  if (adjusted.warehouseIds?.length) {
    // Intersect requested warehouses with user's assigned ones.
    const allowed = adjusted.warehouseIds.filter((id) =>
      acl.assignedWarehouseIds.includes(id)
    );
    
    if (!allowed.length) {
      // No overlap — short-circuit at the service layer.
      adjusted.forceEmptyResult = true;
      return adjusted;
    }
    
    adjusted.warehouseIds = allowed;
    return adjusted;
  }
  
  // No warehouse filter requested — scope down to assigned warehouses only.
  adjusted.warehouseIds = acl.assignedWarehouseIds;
  return adjusted;
};

// ─── Batch Allocation Engine ──────────────────────────────────────────────────

/**
 * Allocates inventory batches to order items using the specified strategy.
 *
 * Builds O(1) lookup indexes by `sku_id` and `packaging_material_id` to avoid
 * N×M candidate filtering. Each order item is matched against its typed candidates
 * and allocated via `allocateBatchesByStrategy`.
 *
 * Pure function — no DB calls, no logging, no side effects.
 *
 * @param {Array<{
 *   order_item_id: string,
 *   sku_id?: string|null,
 *   packaging_material_id?: string|null,
 *   quantity_ordered: number
 * }>} orderItems  - Order items requiring allocation.
 * @param {AllocatableBatch[]}   batches   - Available warehouse inventory batches.
 * @param {'fefo'|'fifo'}        [strategy='fefo']  - Allocation strategy.
 * @returns {AllocationResult[]}
 */
const allocateBatchesForOrderItems = (
  orderItems,
  batches,
  strategy = 'fefo'
) => {
  // Build indexes keyed by sku_id and packaging_material_id for O(1) lookup.
  const bySku = new Map();
  const byMat = new Map();
  
  for (const b of batches ?? []) {
    if (b?.sku_id) {
      if (!bySku.has(b.sku_id)) bySku.set(b.sku_id, []);
      bySku.get(b.sku_id).push(b);
    }
    if (b?.packaging_material_id) {
      if (!byMat.has(b.packaging_material_id)) byMat.set(b.packaging_material_id, []);
      byMat.get(b.packaging_material_id).push(b);
    }
  }
  
  return (orderItems ?? []).map((item) => {
    const { order_item_id, sku_id, packaging_material_id, quantity_ordered } = item;
    
    // Select candidates from the appropriate index.
    const candidates = sku_id
      ? (bySku.get(sku_id) ?? [])
      : packaging_material_id
        ? (byMat.get(packaging_material_id) ?? [])
        : [];
    
    const { allocatedBatches, allocatedTotal, remaining, fulfilled, partial } =
      allocateBatchesByStrategy(candidates, quantity_ordered, { strategy });
    
    return {
      order_item_id,
      sku_id:                sku_id               ?? null,
      packaging_material_id: packaging_material_id ?? null,
      quantity_ordered,
      allocated: { allocatedBatches, allocatedTotal, remaining, fulfilled, partial },
    };
  });
};

/**
 * Allocates quantity from a list of batches using FEFO or FIFO ordering.
 *
 * Strategy sort fields:
 *  - `fefo` → `expiry_date ASC NULLS LAST`
 *  - `fifo` → `inbound_date ASC NULLS LAST`
 *
 * Available quantity per batch is computed as:
 *   `max(0, warehouse_quantity - reserved_quantity)`
 *
 * Batches with zero available quantity are skipped. Allocation accumulates
 * across batches until the required quantity is met or candidates are exhausted.
 *
 * @param {AllocatableBatch[]} batches           - Candidate batches.
 * @param {number}             requiredQuantity  - Total quantity needed.
 * @param {object}             [options]
 * @param {'fefo'|'fifo'}      [options.strategy='fefo']        - Sort strategy.
 * @param {boolean}            [options.excludeExpired=false]   - Drop expired batches (FEFO only).
 * @param {Date}               [options.now=new Date()]         - Reference time for expiry checks.
 * @returns {{
 *   allocatedBatches: AllocatedBatch[],
 *   allocatedTotal:   number,
 *   remaining:        number,
 *   fulfilled:        boolean,
 *   partial:          boolean
 * }}
 */
const allocateBatchesByStrategy = (
  batches,
  requiredQuantity,
  { strategy = 'fefo', excludeExpired = false, now = new Date() } = {}
) => {
  if (!Array.isArray(batches) || requiredQuantity <= 0) {
    return {
      allocatedBatches: [],
      allocatedTotal:   0,
      remaining:        Math.max(0, requiredQuantity || 0),
      fulfilled:        false,
      partial:          false,
    };
  }
  
  const sortField = strategy === 'fifo' ? 'inbound_date' : 'expiry_date';
  
  // Compute available quantity per batch and filter out unavailable ones.
  let candidates = batches
    .map((b) => {
      const reserved = Math.max(0, Number(b.reserved_quantity || 0));
      const available = Math.max(0, Number(b.warehouse_quantity || 0) - reserved);
      return { ...b, _available: available };
    })
    .filter((b) => b._available > 0);
  
  // Optionally exclude expired batches when using FEFO.
  if (excludeExpired && sortField === 'expiry_date') {
    candidates = candidates.filter(
      (b) => b.expiry_date && new Date(b.expiry_date) >= now
    );
  }
  
  // Sort by strategy field — batches missing the sort field sort to the end.
  candidates.sort((a, b) => {
    const da = a[sortField] ? new Date(a[sortField]).getTime() : Number.POSITIVE_INFINITY;
    const db = b[sortField] ? new Date(b[sortField]).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });
  
  const allocatedBatches = [];
  let accumulated        = 0;
  
  for (const batch of candidates) {
    if (accumulated >= requiredQuantity) break;
    
    const needed = requiredQuantity - accumulated;
    const take   = Math.min(batch._available, needed);
    if (take <= 0) continue;
    
    allocatedBatches.push({ ...batch, allocated_quantity: take });
    accumulated += take;
  }
  
  const allocatedTotal = accumulated;
  const remaining      = Math.max(0, requiredQuantity - allocatedTotal);
  const fulfilled      = remaining === 0;
  const partial        = !fulfilled && allocatedTotal > 0;
  
  return { allocatedBatches, allocatedTotal, remaining, fulfilled, partial };
};

// ─── Order Item Display ───────────────────────────────────────────────────────

/**
 * Resolves a human-readable display code and name for an order item.
 *
 * Handles multiple column alias conventions used by different queries:
 *  - Product SKUs:        `sku_code` or `sku` / `getProductDisplayName`
 *  - Packaging materials: `material_code` or `packaging_material_code`
 *                         `material_name` or `packaging_material_name`
 *
 * Returns `{ itemCode: null, itemName: null }` when metadata is absent or
 * does not match a recognized item type.
 *
 * @param {OrderItemDisplayMeta} meta
 * @returns {{ itemCode: string|null, itemName: string|null }}
 */
const resolveOrderItemDisplay = (meta) => {
  if (!meta) return { itemCode: null, itemName: null };
  
  if (meta.sku_id) {
    return {
      itemCode: meta.sku_code ?? meta.sku ?? null,
      itemName: getProductDisplayName(meta) ?? null,
    };
  }
  
  if (meta.packaging_material_id) {
    return {
      itemCode: meta.material_code             ?? meta.packaging_material_code ?? null,
      itemName: meta.material_name             ?? meta.packaging_material_name ?? null,
    };
  }
  
  return { itemCode: null, itemName: null };
};

// ─── Allocation Status Validation ─────────────────────────────────────────────

// Forward-only allocation status sequence — transitions must move rightward.
const ALLOCATION_STATUS_SEQUENCE = [
  'ALLOC_PENDING',
  'ALLOC_CONFIRMED',
  'ALLOC_PARTIAL',
  'ALLOC_COMPLETED',
  'ALLOC_FULFILLING',
  'ALLOC_FULFILLED',
  'ALLOC_CANCELLED',
];

// Terminal statuses — no further transitions are permitted from these.
const ALLOCATION_FINAL_STATUSES = ['ALLOC_FULFILLED', 'ALLOC_CANCELLED'];

/**
 * Returns true if the given allocation status code is terminal.
 *
 * @param {string} code
 * @returns {boolean}
 */
const isFinalStatus = (code) => ALLOCATION_FINAL_STATUSES.includes(code);

/**
 * Validates whether a transition from `currentCode` to `nextCode` is permitted.
 *
 * Rules enforced:
 *  - Both codes must exist in `ALLOCATION_STATUS_SEQUENCE`.
 *  - Transitions from terminal statuses are always rejected.
 *  - Backward transitions are rejected (nextIndex must be > currentIndex).
 *
 * @param {string} currentCode - Current allocation status code.
 * @param {string} nextCode    - Target allocation status code.
 * @returns {void}
 *
 * @throws {AppError} `validationError` — unknown codes, terminal source, or backward transition.
 */
const validateAllocationStatusTransition = (currentCode, nextCode) => {
  const currentIndex = ALLOCATION_STATUS_SEQUENCE.indexOf(currentCode);
  const nextIndex    = ALLOCATION_STATUS_SEQUENCE.indexOf(nextCode);
  
  if (currentIndex === -1 || nextIndex === -1) {
    throw AppError.validationError(
      `Invalid allocation status code(s): ${currentCode}, ${nextCode}`
    );
  }
  
  if (isFinalStatus(currentCode)) {
    throw AppError.validationError(
      `Cannot transition from final allocation status: ${currentCode}`
    );
  }
  
  if (nextIndex <= currentIndex) {
    throw AppError.validationError(
      `Cannot transition allocation status backward: ${currentCode} → ${nextCode}`
    );
  }
};

// ─── Per-Item Allocation Status ───────────────────────────────────────────────

/**
 * Computes allocation status for each order item by comparing allocated vs ordered quantity.
 *
 * Status codes returned:
 *  - `ORDER_ALLOCATED`           — allocatedQty === orderedQty (fully matched)
 *  - `ORDER_PARTIALLY_ALLOCATED` — 0 < allocatedQty < orderedQty
 *  - `ORDER_BACKORDERED`         — allocatedQty === 0
 *
 * @param {Array<{ order_item_id: string, quantity_ordered: number }>} orderItemsMetadata
 * @param {Array<{ order_item_id: string, allocated_quantity: number }>} inventoryAllocationDetails
 * @returns {AllocationStatusPerItem[]}
 */
const computeAllocationStatusPerItem = (
  orderItemsMetadata,
  inventoryAllocationDetails
) => {
  // Aggregate total allocated quantity per order item in a single pass.
  const allocationMap = inventoryAllocationDetails.reduce((acc, row) => {
    acc[row.order_item_id] = (acc[row.order_item_id] || 0) + Number(row.allocated_quantity);
    return acc;
  }, {});
  
  return orderItemsMetadata.map((item) => {
    const orderItemId  = item.order_item_id;
    const orderedQty   = Number(item.quantity_ordered || 0);
    const allocatedQty = allocationMap[orderItemId] || 0;
    const isMatched    = allocatedQty === orderedQty;
    
    const allocationStatus =
      allocatedQty === 0        ? 'ORDER_BACKORDERED'         :
        allocatedQty < orderedQty ? 'ORDER_PARTIALLY_ALLOCATED' :
          'ORDER_ALLOCATED';
    
    return { orderItemId, isMatched, allocatedQty, orderedQty, allocationStatus };
  });
};

// ─── Warehouse-Batch Key Utilities ────────────────────────────────────────────

/**
 * Deduplicates `(warehouse_id, batch_id)` pairs from allocation records.
 *
 * Used before row-level locking and bulk updates to ensure each
 * warehouse_inventory row is targeted exactly once.
 *
 * @param {Array<{ warehouse_id: string, batch_id: string }>} allocationDetails
 * @returns {Array<{ warehouse_id: string, batch_id: string }>} Unique pairs.
 *
 * @example
 * dedupeWarehouseBatchKeys([
 *   { warehouse_id: 'w1', batch_id: 'b1' },
 *   { warehouse_id: 'w1', batch_id: 'b1' },
 *   { warehouse_id: 'w2', batch_id: 'b2' },
 * ]);
 * // => [{ warehouse_id: 'w1', batch_id: 'b1' }, { warehouse_id: 'w2', batch_id: 'b2' }]
 */
const dedupeWarehouseBatchKeys = (allocationDetails) => {
  const seen       = new Set();
  const uniqueKeys = [];
  
  for (const { warehouse_id, batch_id } of allocationDetails) {
    const key = `${warehouse_id}::${batch_id}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueKeys.push({ warehouse_id, batch_id });
    }
  }
  
  return uniqueKeys;
};

// ─── Reserved Quantity Updates ────────────────────────────────────────────────

/**
 * Computes updated reserved quantities and inventory statuses for confirmed allocations.
 *
 * Steps:
 *  1. Aggregates total allocated quantity per `(warehouse_id, batch_id)` key.
 *  2. For each warehouse record, validates the allocation does not exceed available stock.
 *  3. Computes new `reserved_quantity` and derives `status_id` from remaining quantity.
 *
 * Pure function — does not mutate inputs. Returns a new array ready for bulk persistence.
 *
 * @param {Array<{ warehouse_id: string, batch_id: string, allocated_quantity: number }>} allocations
 * @param {Array<{ id: string, warehouse_id: string, batch_id: string, warehouse_quantity: number, reserved_quantity: number }>} warehouseBatchInfo
 * @param {{ inStockStatusId: string, outOfStockStatusId: string }} statusIds
 * @returns {WarehouseBatchUpdate[]}
 *
 * @throws {AppError} `conflictError` — allocation quantity exceeds available stock.
 */
const updateReservedQuantitiesFromAllocations = (
  allocations,
  warehouseBatchInfo,
  { inStockStatusId, outOfStockStatusId }
) => {
  // Aggregate total allocated quantity per (warehouse_id, batch_id) key in one pass.
  const allocationMap = {};
  
  for (const { warehouse_id, batch_id, allocated_quantity } of allocations) {
    const key          = `${warehouse_id}__${batch_id}`;
    allocationMap[key] = (allocationMap[key] || 0) + Number(allocated_quantity);
  }
  
  return warehouseBatchInfo.map((record) => {
    const key            = `${record.warehouse_id}__${record.batch_id}`;
    const allocationQty  = allocationMap[key] || 0;
    const currentReserved = Number(record.reserved_quantity || 0);
    const availableQty   = Number(record.warehouse_quantity) - currentReserved;
    
    // Prevent over-reservation — throw before any mutation.
    if (allocationQty > availableQty) {
      throw AppError.conflictError(
        `Insufficient stock to fulfill allocation request. ` +
        `Available: ${availableQty}, Requested: ${allocationQty}`
      );
    }
    
    const newReservedQty = currentReserved + allocationQty;
    const remainingQty   = Number(record.warehouse_quantity) - newReservedQty;
    
    return {
      id:                 record.id,
      warehouse_id:       record.warehouse_id,
      batch_id:           record.batch_id,
      warehouse_quantity: record.warehouse_quantity,
      reserved_quantity:  newReservedQty,
      status_id:          remainingQty > 0 ? inStockStatusId : outOfStockStatusId,
    };
  });
};

// ─── Allocation Result Builder ────────────────────────────────────────────────

/**
 * Constructs a structured allocation result summary for service-layer output.
 *
 * Aggregates allocation IDs, affected warehouse inventory IDs, activity log IDs,
 * overall fulfillment status, and per-item allocation outcomes into a single
 * normalized object consumed by the response transformer.
 *
 * @param {OrderAllocationResultInput} params
 * @returns {OrderAllocationResult}
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
    allocationIds:                inventoryAllocations.map((a) => a.allocation_id),
    updatedWarehouseInventoryIds: warehouseUpdateIds.map((r) => r.id),
    logIds:                       inventoryLogIds,
    fullyAllocated,
    updatedItemStatuses:          allocationResults.map((res) => ({
      orderItemId:      res.orderItemId,
      newStatus:        res.allocationStatus,
      isFullyAllocated: res.isMatched,
    })),
  };
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  evaluateInventoryAllocationVisibility,
  applyInventoryAllocationVisibilityRules,
  allocateBatchesForOrderItems,
  allocateBatchesByStrategy,
  resolveOrderItemDisplay,
  validateAllocationStatusTransition,
  computeAllocationStatusPerItem,
  dedupeWarehouseBatchKeys,
  updateReservedQuantitiesFromAllocations,
  buildOrderAllocationResult,
};
