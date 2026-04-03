/**
 * @file inventory-allocation-service.js
 * @description Business logic for inventory allocation lifecycle operations.
 *
 * Exports:
 *   - allocateInventoryForOrderService          – allocates inventory batches to order items
 *   - reviewInventoryAllocationService          – retrieves allocation review data for an order
 *   - fetchPaginatedInventoryAllocationsService – paginated allocation list with filtering/sorting
 *   - confirmInventoryAllocationService         – confirms allocations and updates warehouse quantities
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { withTransaction, lockRows }              = require('../database/db');
const {
  fetchOrderMetadata,
  updateOrderStatus,
  getInventoryAllocationsByOrderId,
}                                                = require('../repositories/order-repository');
const {
  validateStatusTransitionByCategory,
}                                                = require('../business/order-business');
const {
  getOrderItemsByOrderId,
  updateOrderItemStatusesByOrderId,
  updateOrderItemStatus,
}                                                = require('../repositories/order-item-repository');
const AppError                                   = require('../utils/AppError');
const {
  extractOrderItemIdsByType,
  transformAllocationResultToInsertRows,
  transformAllocationReviewData,
  transformInventoryAllocationReviewRows,
  transformOrderAllocationResponse,
  transformPaginatedInventoryAllocationResults,
}                                                = require('../transformers/inventory-allocation-transformer');
const { getStatusId }                            = require('../config/status-cache');
const {
  getAllocatableBatchesByWarehouse,
  getWarehouseInventoryQuantities,
  bulkUpdateWarehouseQuantities,
}                                                = require('../repositories/warehouse-inventory-repository');
const {
  allocateBatchesForOrderItems,
  computeAllocationStatusPerItem,
  updateReservedQuantitiesFromAllocations,
  buildWarehouseInventoryActivityLogsForOrderAllocation,
  buildOrderAllocationResult,
  validateAllocationStatusTransition,
  resolveOrderItemDisplay,
}                                                = require('../business/inventory-allocation-business');
const {
  insertInventoryAllocationsBulk,
  getMismatchedAllocationIds,
  getInventoryAllocationReview,
  updateInventoryAllocationStatus,
  getPaginatedInventoryAllocations,
  getAllocationStatuses,
}                                                = require('../repositories/inventory-allocations-repository');
const { logSystemWarn }                          = require('../utils/logging/system-logger');
const {
  getOrderStatusByCode,
  getOrderStatusesByCodes,
}                                                = require('../repositories/order-status-repository');
const {
  getInventoryActionTypeId,
}                                                = require('../repositories/inventory-action-type-repository');
const {
  insertInventoryActivityLogs,
}                                                = require('../repositories/inventory-log-repository');
const {
  getInventoryAllocationStatusId,
}                                                = require('../repositories/inventory-allocation-status-repository');
const {
  dedupeWarehouseBatchKeys,
}                                                = require('../utils/inventory-allocation-utils');

/**
 * Allocates inventory batches to order items using the specified strategy.
 *
 * Locks order, order items, and warehouse inventory rows for the duration of
 * the transaction. Validates status transitions, applies the allocation strategy,
 * inserts allocation records, and updates order/item statuses.
 *
 * @param {Object}  user                          - Authenticated user (requires `id`).
 * @param {string}  rawOrderId                    - UUID of the order to allocate.
 * @param {Object}  options
 * @param {string}  [options.strategy='fefo']     - Allocation strategy (`'fefo'`).
 * @param {string}  options.warehouseId           - UUID of the warehouse to allocate from.
 * @param {boolean} [options.allowPartial=false]  - Whether partial allocation is permitted.
 *
 * @returns {Promise<{ orderId: string, allocationIds: string[] }>}
 *
 * @throws {AppError} `validationError`  – missing warehouseId, invalid item statuses, or insufficient inventory.
 * @throws {AppError} `notFoundError`    – no order items found for the order.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const allocateInventoryForOrderService = async (
  user,
  rawOrderId,
  { strategy = 'fefo', warehouseId, allowPartial = false }
) => {
  const context = 'inventory-allocation-service/allocateInventoryForOrderService';
  
  if (!warehouseId) {
    throw AppError.validationError('Warehouse ID is required for allocation.');
  }
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      // Lock order row before reading metadata.
      await lockRows(client, 'orders', [rawOrderId], 'FOR UPDATE', {
        context: `${context}/lockOrderRow`,
      });
      
      const orderMetadata = await fetchOrderMetadata(rawOrderId, client);
      const {
        order_status_category: currentStatusCategory,
        order_status_code:     currentStatusCode,
        order_category:        orderCategory,
        order_id:              orderId,
      } = orderMetadata;
      
      const {
        id:       nextStatusId,
        category: nextStatusCategory,
        code:     resolvedNextStatusCode,
      } = await getOrderStatusByCode('ORDER_ALLOCATING', client);
      
      validateStatusTransitionByCategory(
        orderCategory,
        currentStatusCategory,
        nextStatusCategory,
        currentStatusCode,
        resolvedNextStatusCode
      );
      
      const orderItemsMetadata = await getOrderItemsByOrderId(orderId, client);
      const orderItemIds       = orderItemsMetadata.map((item) => item.order_item_id);
      const orderItemMap       = new Map(
        orderItemsMetadata.map((item) => [item.order_item_id, item])
      );
      
      // Lock order_items rows before validating statuses.
      await lockRows(client, 'order_items', orderItemIds, 'FOR UPDATE', {
        context: `${context}/lockOrderItems`,
      });
      
      if (!orderItemsMetadata.length) {
        throw AppError.notFoundError(`No order items found for order ID: ${orderId}`);
      }
      
      const ALLOCATABLE_ITEM_STATUSES = ['ORDER_CONFIRMED'];
      const invalidItems = orderItemsMetadata.filter(
        (item) => !ALLOCATABLE_ITEM_STATUSES.includes(item.order_item_code)
      );
      
      if (invalidItems.length > 0) {
        throw AppError.validationError(
          `Allocation blocked. Invalid item statuses: ${invalidItems.map((i) => i.order_item_id).join(', ')}`
        );
      }
      
      const { skuIds, packagingMaterialIds } = extractOrderItemIdsByType(orderItemsMetadata);
      const inStockStatusId                  = getStatusId('inventory_in_stock');
      
      const batches = await getAllocatableBatchesByWarehouse(
        { skuIds, packagingMaterialIds, warehouseId, inventoryStatusId: inStockStatusId },
        { strategy },
        client
      );
      
      // Lock warehouse_inventory rows before reading quantities.
      const warehouseInventoryLockConditions = batches.map((batch) => ({
        warehouse_id: batch.warehouse_id,
        batch_id:     batch.batch_id,
      }));
      
      await lockRows(client, 'warehouse_inventory', warehouseInventoryLockConditions, 'FOR UPDATE', {
        context: `${context}/lockWarehouseInventory`,
      });
      
      const allocationResult = allocateBatchesForOrderItems(orderItemsMetadata, batches, strategy);
      
      const missingBatchItems = allocationResult.filter(
        (item) => !item.allocated.allocatedBatches || item.allocated.allocatedBatches.length === 0
      );
      
      if (missingBatchItems.length > 0) {
        const items = missingBatchItems.map((item) => {
          const meta                   = orderItemMap.get(item.order_item_id);
          const { itemCode, itemName } = resolveOrderItemDisplay(meta);
          return { itemCode, itemName, requestedQuantity: item.quantity_ordered };
        });
        
        throw AppError.validationError(
          'No inventory batches are available in the selected warehouse for some items.',
          { code: 'NO_WAREHOUSE_INVENTORY', details: { items } }
        );
      }
      
      const insufficientItems = allocationResult
        .filter((item) => item.allocated.allocatedTotal < item.quantity_ordered)
        .map((item) => {
          const meta                   = orderItemMap.get(item.order_item_id);
          const { itemCode, itemName } = resolveOrderItemDisplay(meta);
          const firstBatch             = item.allocated.allocatedBatches?.[0];
          
          return {
            itemCode,
            itemName,
            warehouseName:     firstBatch?.warehouse_name ?? null,
            lotNumber:         firstBatch?.lot_number     ?? null,
            requestedQuantity: item.quantity_ordered,
            allocatedQuantity: item.allocated.allocatedTotal,
            missingQuantity:   item.quantity_ordered - item.allocated.allocatedTotal,
          };
        });
      
      if (insufficientItems.length > 0 && !allowPartial) {
        throw AppError.validationError(
          'Some items cannot be fully allocated due to insufficient inventory.',
          { code: 'INSUFFICIENT_INVENTORY', details: { items: insufficientItems, canAllowPartial: true } }
        );
      }
      
      const inventoryAllocationStatusPendingId = getStatusId('inventory_allocation_init');
      const allocations = transformAllocationResultToInsertRows(allocationResult, {
        status_id:  inventoryAllocationStatusPendingId,
        created_by: userId,
      });
      
      const rawAllocations = await insertInventoryAllocationsBulk(allocations, client);
      
      await updateOrderStatus(client, { orderId, newStatusId: nextStatusId, updatedBy: userId });
      await updateOrderItemStatusesByOrderId(client, { orderId, newStatusId: nextStatusId, updatedBy: userId });
      
      return transformAllocationReviewData(rawAllocations, orderId);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to allocate inventory for order.');
  }
};

/**
 * Retrieves and transforms allocation review data for a given order.
 *
 * Validates that provided allocation IDs belong to the order before fetching.
 * Returns `null` if no review data is found.
 *
 * @param {string}   orderId        - UUID of the order.
 * @param {string[]} warehouseIds   - Warehouse IDs to scope the review.
 * @param {string[]} allocationIds  - Allocation IDs to filter by (maybe empty).
 *
 * @returns {Promise<Object|null>} Transformed review data or `null` if none found.
 *
 * @throws {AppError} `validationError` – allocation IDs do not belong to the order.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const reviewInventoryAllocationService = async (orderId, warehouseIds, allocationIds) => {
  const context = 'inventory-allocation-service/reviewInventoryAllocationService';
  
  try {
    if (allocationIds.length > 0) {
      const mismatches = await getMismatchedAllocationIds(orderId, allocationIds, null);
      
      if (mismatches.length > 0) {
        // Warn on mismatched IDs — security-notable event, not an unexpected error.
        logSystemWarn('Mismatched allocation IDs found during review', {
          context,
          orderId,
          mismatches,
        });
        
        throw AppError.validationError(
          'Some allocation IDs do not belong to the order.',
          { mismatches }
        );
      }
    }
    
    const rawReviewData = await getInventoryAllocationReview(orderId, warehouseIds, allocationIds, null);
    
    if (!rawReviewData || rawReviewData.length === 0) return null;
    
    return transformInventoryAllocationReviewRows(rawReviewData);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to retrieve inventory allocation review.');
  }
};

/**
 * Fetches paginated inventory allocation records with optional filtering and sorting.
 *
 * @param {Object}        options
 * @param {Object}        [options.filters={}]           - Field filters to apply.
 * @param {number}        [options.page=1]               - Page number (1-based).
 * @param {number}        [options.limit=10]             - Records per page.
 * @param {string}        [options.sortBy='createdAt']   - Sort field key (validated against sort map).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']     - Sort direction.
 *
 * @returns {Promise<PaginatedResult<InventoryAllocationRow>>}
 *
 * @throws {AppError} Re-throws AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const fetchPaginatedInventoryAllocationsService = async ({
                                                           filters   = {},
                                                           page      = 1,
                                                           limit     = 10,
                                                           sortBy    = 'createdAt',
                                                           sortOrder = 'DESC',
                                                         }) => {
  try {
    const rawResult = await getPaginatedInventoryAllocations({ filters, page, limit, sortBy, sortOrder });
    return transformPaginatedInventoryAllocationResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to fetch inventory allocations.');
  }
};

/**
 * Confirms pending inventory allocations, updates warehouse quantities, order and
 * item statuses, and inserts inventory activity logs — all within a single transaction.
 *
 * @param {Object} user       - Authenticated user (requires `id`).
 * @param {string} rawOrderId - UUID of the order to confirm allocations for.
 *
 * @returns {Promise<Object>} Transformed allocation confirmation response.
 *
 * @throws {AppError} `notFoundError`  – no order items found for the order.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `AppError.serviceError`.
 */
const confirmInventoryAllocationService = async (user, rawOrderId) => {
  const context = 'inventory-allocation-service/confirmInventoryAllocationService';
  
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      // 1. Lock order and order items rows before any reads.
      await lockRows(client, 'orders', [rawOrderId], 'FOR UPDATE', {
        context: `${context}/lockOrder`,
      });
      
      const orderItemsMetadata = await getOrderItemsByOrderId(rawOrderId, client);
      const orderItemIds       = orderItemsMetadata.map((item) => item.order_item_id);
      
      await lockRows(client, 'order_items', orderItemIds, 'FOR UPDATE', {
        context: `${context}/lockOrderItems`,
        orderId: rawOrderId,
      });
      
      if (!orderItemsMetadata.length) {
        throw AppError.notFoundError(`No order items found for order ID: ${rawOrderId}`);
      }
      
      // 2. Validate each allocation status can transition to ALLOC_CONFIRMED.
      const allocationStatuses = await getAllocationStatuses(rawOrderId, orderItemIds, client);
      
      allocationStatuses.forEach(({ allocation_status_code: code }) => {
        validateAllocationStatusTransition(code, 'ALLOC_CONFIRMED');
      });
      
      const orderId = allocationStatuses[0]?.order_id;
      
      // 3. Fetch allocations and compute per-item allocation status.
      const inventoryAllocationDetails = await getInventoryAllocationsByOrderId(orderId, client);
      const allocationResults          = computeAllocationStatusPerItem(
        orderItemsMetadata,
        inventoryAllocationDetails
      );
      
      const uniqueStatusCodes = [...new Set(allocationResults.map((res) => res.allocationStatus))];
      const statusList        = await getOrderStatusesByCodes(uniqueStatusCodes, client);
      const statusCodeToIdMap = Object.fromEntries(statusList.map(({ code, id }) => [code, id]));
      
      // 4. Update order item statuses based on allocation results.
      for (const { orderItemId, allocationStatus } of allocationResults) {
        const newStatusId = statusCodeToIdMap[allocationStatus];
        await updateOrderItemStatus(client, { orderItemId, newStatusId, updatedBy: userId });
      }
      
      // 5. Update order status if fully allocated.
      const hasUnallocatedItems = allocationResults.some((res) => !res.isMatched);
      
      if (!hasUnallocatedItems) {
        const orderStatusCode = allocationResults[0].allocationStatus;
        const orderStatusId   = statusCodeToIdMap[orderStatusCode];
        await updateOrderStatus(client, { orderId: rawOrderId, newStatusId: orderStatusId, updatedBy: userId });
      }
      
      // 6. Lock warehouse_inventory rows before reading quantities.
      const keys = dedupeWarehouseBatchKeys(inventoryAllocationDetails);
      await lockRows(client, 'warehouse_inventory', keys, 'FOR UPDATE', {
        context: `${context}/lockWarehouseInventory`,
        orderId: rawOrderId,
      });
      
      const warehouseBatchInfo  = await getWarehouseInventoryQuantities(keys, client);
      const inStockStatusId     = getStatusId('inventory_in_stock');
      const outOfStockStatusId  = getStatusId('inventory_out_of_stock');
      
      // 7. Compute updated reserved quantities and inventory statuses.
      const updates = updateReservedQuantitiesFromAllocations(
        inventoryAllocationDetails,
        warehouseBatchInfo,
        { inStockStatusId, outOfStockStatusId }
      );
      
      const updatesObject = Object.fromEntries(
        updates.map((row) => [
          `${row.warehouse_id}-${row.batch_id}`,
          {
            warehouse_quantity: row.warehouse_quantity,
            reserved_quantity:  row.reserved_quantity,
            status_id:          row.status_id,
            last_update:        new Date(),
          },
        ])
      );
      
      // 8. Apply bulk warehouse inventory updates.
      const updatedWarehouseRecords = await bulkUpdateWarehouseQuantities(updatesObject, userId, client);
      
      // 9. Resolve confirmed and partial allocation IDs and update statuses.
      const confirmedStatusId = await getInventoryAllocationStatusId('ALLOC_CONFIRMED', client);
      const partialStatusId   = await getInventoryAllocationStatusId('ALLOC_PARTIAL', client);
      
      const fullyMatchedItemIds = new Set(
        allocationResults.filter((r) => r.isMatched).map((r) => r.orderItemId)
      );
      const cleanFullyAllocatedIds = inventoryAllocationDetails
        .filter((detail) => fullyMatchedItemIds.has(detail.order_item_id))
        .map((detail) => detail.allocation_id)
        .filter(Boolean);
      
      const partiallyMatchedItemIds = new Set(
        allocationResults.filter((r) => !r.isMatched).map((r) => r.orderItemId)
      );
      const cleanPartialOrUnmatchedIds = inventoryAllocationDetails
        .filter((detail) => partiallyMatchedItemIds.has(detail.order_item_id))
        .map((detail) => detail.allocation_id)
        .filter(Boolean);
      
      if (cleanFullyAllocatedIds.length > 0) {
        await updateInventoryAllocationStatus(
          { statusId: confirmedStatusId, userId, allocationIds: cleanFullyAllocatedIds },
          client
        );
      }
      
      if (cleanPartialOrUnmatchedIds.length > 0) {
        await updateInventoryAllocationStatus(
          { statusId: partialStatusId, userId, allocationIds: cleanPartialOrUnmatchedIds },
          client
        );
      }
      
      // 10. Build and insert inventory activity logs.
      const inventoryActionTypeId    = await getInventoryActionTypeId('reserve', client);
      const inventoryActivityLogs    = buildWarehouseInventoryActivityLogsForOrderAllocation(
        updates,
        warehouseBatchInfo,
        { orderId: rawOrderId, performedBy: userId, actionTypeId: inventoryActionTypeId }
      );
      const logInsertResult = await insertInventoryActivityLogs(inventoryActivityLogs, client, {
        context:     `${context}/insertInventoryActivityLogs`,
        orderId:     rawOrderId,
        performedBy: userId,
      });
      
      // 11. Build and return final response.
      const rawResult = buildOrderAllocationResult({
        orderId: rawOrderId,
        inventoryAllocations:    inventoryAllocationDetails.map(({ allocation_id }) => ({ allocation_id })),
        warehouseUpdateIds:      updatedWarehouseRecords.map(({ warehouse_id, batch_id }) => ({ id: `${warehouse_id}-${batch_id}` })),
        inventoryLogIds:         logInsertResult.activityLogIds.map(String),
        allocationResults,
      });
      
      return transformOrderAllocationResponse(rawResult);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;
    
    throw AppError.serviceError('Unable to confirm inventory allocation for this order.');
  }
};

module.exports = {
  allocateInventoryForOrderService,
  reviewInventoryAllocationService,
  fetchPaginatedInventoryAllocationsService,
  confirmInventoryAllocationService,
};
