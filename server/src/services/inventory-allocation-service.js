const { withTransaction, lockRows } = require('../database/db');
const {
  fetchOrderMetadata,
  updateOrderStatus,
  getInventoryAllocationsByOrderId
} = require('../repositories/order-repository');
const { validateStatusTransitionByCategory } = require('../business/order-business');
const {
  getOrderItemsByOrderId,
  updateOrderItemStatuses, updateOrderItemStatus
} = require('../repositories/order-item-repository');
const AppError = require('../utils/AppError');
const {
  extractOrderItemIdsByType,
  transformAllocationResultToInsertRows,
  transformAllocationReviewData,
  transformInventoryAllocationReviewRows,
  transformOrderAllocationResponse,
} = require('../transformers/inventory-allocation-transformer');
const { getStatusId } = require('../config/status-cache');
const {
  getAllocatableBatchesByWarehouse,
  getWarehouseInventoryQuantities,
  bulkUpdateWarehouseQuantities,
} = require('../repositories/warehouse-inventory-repository');
const {
  allocateBatchesForOrderItems,
  computeAllocationStatusPerItem,
  updateReservedQuantitiesFromAllocations,
  buildWarehouseInventoryActivityLogsForOrderAllocation,
  buildOrderAllocationResult
} = require('../business/inventory-allocation-business');
const {
  insertInventoryAllocationsBulk,
  getMismatchedAllocationIds,
  getInventoryAllocationReview,
  updateInventoryAllocationStatus
} = require('../repositories/inventory-allocations-repository');
const {
  logSystemException,
  logSystemInfo,
  logSystemWarn
} = require('../utils/system-logger');
const { getOrderStatusByCode, getOrderStatusesByCodes } = require('../repositories/order-status-repository');
const { getInventoryActionTypeId } = require('../repositories/inventory-action-type-repository');
const { insertInventoryActivityLogs } = require('../repositories/inventory-log-repository');
const { getInventoryAllocationStatusId } = require('../repositories/inventory-allocation-status-repository');
const { dedupeWarehouseBatchKeys } = require('../utils/inventory-allocation-utils');

/**
 * Allocates inventory batches to each order item using a batch allocation strategy (FEFO/FIFO).
 *
 * This function performs the allocation as a transactional operation with row-level locks:
 * - Locks the target order (`orders`) to prevent concurrent status changes
 * - Locks the associated `order_items` to avoid conflicting allocation processes
 * - Locks affected `warehouse_inventory` rows to guarantee consistency when allocating stock
 * - Validates the current order status and checks status transition validity
 * - Ensures all order items are in an allocatable status (e.g. 'ORDER_CONFIRMED')
 * - Retrieves in-stock batches for the order's SKUs or packaging materials
 * - Applies the chosen allocation strategy (FEFO or FIFO)
 * - Persists allocation rows with `inventory_allocation_init` status
 * - Updates the order and item statuses to `ORDER_ALLOCATING`
 * - Returns a simplified allocation review payload
 *
 * @param {Object} user - Authenticated user object (must include `id`)
 * @param {string} rawOrderId - Raw order UUID
 * @param {Object} options - Allocation configuration
 * @param {'fefo'|'fifo'} [options.strategy='fefo'] - Allocation strategy to use
 * @param {string|null} [options.warehouseId=null] - Warehouse to allocate from
 *
 * @returns {Promise<{ orderId: string, allocationIds: string[] }>} - Summary of created allocations for the order
 *
 * @throws {AppError} If the order is in an invalid status or allocation fails
 */
const allocateInventoryForOrderService = async (user, rawOrderId, {
  strategy = 'fefo',
  warehouseId = null
}) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      // Lock order row first
      await lockRows(client, 'orders', [rawOrderId], 'FOR UPDATE', {
        context: 'allocateInventoryForOrderService/lockOrderRow',
      });
      
      // Fetch current order metadata and validate status transition
      const orderMetadata = await fetchOrderMetadata(rawOrderId, client);
      const {
        order_status_category: currentStatusCategory,
        order_status_code: currentStatusCode,
        order_category: orderCategory,
        order_id: orderId,
      } = orderMetadata;
      
      const {
        id: nextStatusId,
        category: nextStatusCategory,
        code: resolvedNextStatusCode,
      } = await getOrderStatusByCode('ORDER_ALLOCATING', client);
      
      validateStatusTransitionByCategory(
        orderCategory,
        currentStatusCategory,
        nextStatusCategory,
        currentStatusCode,
        resolvedNextStatusCode
      );
      
      // Get order items and ensure only items in allocatable status are processed
      const orderItemsMetadata = await getOrderItemsByOrderId(orderId, client);
      const orderItemIds = orderItemsMetadata.map((item) => item.order_item_id);
      
      // Lock order_items rows for this order
      await lockRows(client, 'order_items', orderItemIds, 'FOR UPDATE', {
        context: 'inventory-allocation-service/allocateInventoryForOrderService/lockOrderItems',
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
          `Allocation blocked. Invalid item statuses: ${invalidItems.map(i => i.order_item_id).join(', ')}`
        );
      }
      
      // Extract SKUs and packaging material IDs to fetch eligible batches
      const { skuIds, packagingMaterialIds } = extractOrderItemIdsByType(orderItemsMetadata);
      const inStockStatusId = getStatusId('inventory_in_stock');
      
      // Query batches eligible for allocation
      const batches = await getAllocatableBatchesByWarehouse(
        {
          skuIds,
          packagingMaterialIds,
          warehouseId,
          inventoryStatusId: inStockStatusId,
        },
        { strategy },
        client
      );
      
      // Lock warehouse_inventory rows BEFORE reading batches
      const warehouseInventoryLockConditions = batches.map((batch) => ({
        warehouse_id: batch.warehouse_id,
        batch_id: batch.batch_id,
      }));
      
      await lockRows(client, 'warehouse_inventory', warehouseInventoryLockConditions, 'FOR UPDATE', {
        context: 'inventory-allocation-service/allocateInventoryForOrderService/lockWarehouseInventory',
      });
      
      // Apply allocation strategy and build result per item
      const allocationResult = allocateBatchesForOrderItems(orderItemsMetadata, batches, strategy);
      
      // Transform to insert rows with audit metadata
      const inventoryAllocationStatusPendingId = getStatusId('inventory_allocation_init');
      const allocations = transformAllocationResultToInsertRows(allocationResult, {
        status_id: inventoryAllocationStatusPendingId,
        created_by: userId,
      });
      
      // Insert allocation records in bulk
      const rawAllocations = await insertInventoryAllocationsBulk(allocations, client);
      
      await updateOrderStatus(client, {
        orderId,
        newStatusId: nextStatusId,
        updatedBy: userId,
      });
      
      await updateOrderItemStatuses(client, {
        orderId,
        newStatusId: nextStatusId,
        updatedBy: userId,
      });
      
      // Return simplified review object
      return transformAllocationReviewData(rawAllocations, orderId);
    });
  } catch (error) {
    logSystemException(error, 'Inventory allocation failed', {
      context: 'inventory-allocation-service/allocateInventoryForOrderService',
      orderId: rawOrderId,
      userId: user?.id,
      strategy,
      warehouseId,
    });
    
    throw AppError.serviceError('Failed to allocate inventory for order.');
  }
};

/**
 * Validates and returns detailed inventory allocation review data for a specific order.
 *
 * This service performs the following:
 * 1. If `allocationIds` are provided, validates that each one belongs to the specified order.
 *    - If mismatches are found, throws a validation error with the mismatched IDs.
 * 2. Queries the database for inventory allocation review data matching the given `orderId`,
 *    and optionally filtered by `warehouseIds` and `allocationIds`.
 * 3. If no allocations are found, returns `null`.
 * 4. Transforms raw rows into structured format including:
 *    - Order metadata
 *    - Allocation-level data
 *    - Related SKU/product or packaging material info
 *    - Batch and warehouse inventory info
 * 5. Logs key events and throws a service error if any failure occurs.
 *
 * @async
 *
 * @param {string} orderId - UUID of the order to review.
 * @param {string[]} warehouseIds - Optional list of warehouse UUIDs to filter allocations.
 * @param {string[]} allocationIds - Optional list of allocation UUIDs to validate and fetch.
 *
 * @returns {Promise<{ header: object, items: object[] } | null>} - Structured review result, or `null` if no matching allocations found.
 *
 * @throws {AppError} - Throws:
 *   - `AppError.validationError` if provided allocation IDs do not belong to the order.
 *   - `AppError.serviceError` for any other failures during review processing.
 */
const reviewInventoryAllocationService = async (orderId, warehouseIds, allocationIds) => {
  try {
    if (allocationIds.length > 0) {
      const mismatches = await getMismatchedAllocationIds(orderId, allocationIds);
      
      if (mismatches.length > 0) {
        logSystemWarn('Mismatched allocation IDs found during review', {
          context: 'inventory-allocation-service/reviewInventoryAllocationService',
          orderId,
          mismatches,
        });
        throw AppError.validationError('Some allocation IDs do not belong to the order', { mismatches });
      }
    }

    const rawReviewData = await getInventoryAllocationReview(orderId, warehouseIds, allocationIds);

    if (!rawReviewData || rawReviewData.length === 0) {
      return null;
    }

    return transformInventoryAllocationReviewRows(rawReviewData);
  } catch (error) {
    logSystemException(error, 'Failed to review inventory for order', {
      context: 'inventory-allocation-service/reviewInventoryAllocationService',
      orderId,
      warehouseIds,
      allocationIds,
    });
    throw AppError.serviceError('Failed to review inventory for order.');
  }
};

/**
 * Confirms inventory allocations for a given sales order.
 *
 * ## Core Responsibilities
 * This service performs a multistep confirmation process under a single transaction:
 * - Locks the target sales order row to prevent status race conditions.
 * - Locks associated order items and retrieves their metadata.
 * - Fetches related inventory allocation records.
 * - Computes allocation results per item (fully allocated, partially allocated, or backordered).
 * - Updates individual order item statuses and, if applicable, the overall order status.
 * - Locks and updates `warehouse_inventory` rows to reflect new reserved quantities and inventory statuses.
 * - Logs inventory actions (e.g., reserve) for traceability and auditing.
 * - Updates allocation statuses to "ALLOC_CONFIRMED" or "ALLOC_PARTIAL" accordingly.
 * - Returns a transformed allocation result for API consumers or downstream services.
 *
 * ## Transactional Guarantees
 * All operations are performed atomically using a single transaction.
 * This guarantees consistency between inventory state, allocations, and order statuses.
 *
 * ## Performance and Concurrency Notes
 * - Relies on composite row locks (e.g., `FOR UPDATE`) to safely modify related entities.
 * - Uses bulk updates and batch reads where possible.
 * - Assumes indexes exist on `order_id`, `status_id`, and `(warehouse_id, batch_id)` to ensure query and lock efficiency.
 * - Expected to scale efficiently under concurrent load, assuming allocations are pre-resolved.
 *
 * @function
 * @param {object} user - The authenticated user initiating the confirmation (must include `id`).
 * @param {string} rawOrderId - The UUID of the sales order to confirm inventory allocations for.
 * @returns {Promise<object>} A transformed allocation result object with metadata, updated rows, and log IDs.
 * @throws {AppError} If the order, items, or allocations are missing or if any DB error occurs.
 */
const confirmInventoryAllocationService = async (user, rawOrderId) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      // Lock order row to prevent race conditions on status update
      await lockRows(client, 'orders', [rawOrderId], 'FOR UPDATE', {
        context: 'inventory-allocation-service/confirmInventoryAllocationService/lockOrder',
      });
      
      // Fetch and lock all order_items belonging to this order (needed for status updates)
      const orderItemsMetadata = await getOrderItemsByOrderId(rawOrderId, client);
      const orderItemIds = orderItemsMetadata.map(item => item.order_item_id);
      await lockRows(client, 'order_items', orderItemIds, 'FOR UPDATE', {
        context: 'inventory-allocation-service/confirmInventoryAllocationService/lockOrderItems',
        orderId: rawOrderId,
      });
      
      logSystemInfo('Fetched order items for allocation', {
        context: 'inventory-allocation-service/confirmInventoryAllocationService',
        orderId: rawOrderId,
        itemCount: orderItemsMetadata.length,
      });
      
      // Defensive check: should never happen unless data integrity is broken
      if (!orderItemsMetadata.length) {
        throw AppError.notFoundError(`No order items found for order ID: ${rawOrderId}`);
      }
      
      // Get all inventory allocations linked to this order
      const inventoryAllocationDetails = await getInventoryAllocationsByOrderId(rawOrderId, client);
      
      // Determine allocation status per item: ORDER_ALLOCATED, ORDER_PARTIALLY_ALLOCATED, or ORDER_BACKORDERED
      const allocationResults = computeAllocationStatusPerItem(orderItemsMetadata, inventoryAllocationDetails);
      
      // Convert allocation status codes (e.g., 'ORDER_ALLOCATED') to DB IDs
      const uniqueStatusCodes = [...new Set(allocationResults.map((res) => res.allocationStatus))];
      const statusCodeToIdMap = {};
      const statusList = await getOrderStatusesByCodes(uniqueStatusCodes, client);
      
      for (const { code, id } of statusList) {
        statusCodeToIdMap[code] = id;
      }
      
      // Update each order item's status based on allocation results
      // Uses individual update calls — ensure underlying function supports batch for better performance
      let hasStatusUpdates = false;
      for (const { orderItemId, allocationStatus } of allocationResults) {
        const newStatusId = statusCodeToIdMap[allocationStatus];
        const updated = await updateOrderItemStatus(client, {
          orderItemId,
          newStatusId,
          updatedBy: userId,
        });
        
        if (updated) {
          hasStatusUpdates = true;
        }
      }
      
      // If all items are fully allocated, update the overall order status to match
      // Only update order status if all items are matched — avoids setting "confirmed" on partially fulfilled orders
      const hasUnallocatedItems = allocationResults.some((res) => !res.isMatched);
      // `isMatched` means allocation fully satisfies item quantity
      
      if (!hasUnallocatedItems) {
        const orderStatusCode = allocationResults[0].allocationStatus;
        const orderStatusId = statusCodeToIdMap[orderStatusCode];
        
        await updateOrderStatus(client, {
          orderId: rawOrderId,
          newStatusId: orderStatusId,
          updatedBy: userId,
        });
        
        // Allocation status updates completed. Order-level state now reflects confirmed inventory state.
        logSystemInfo('Order status updated based on fully matched allocations', {
          context: 'inventory-allocation-service/confirmInventoryAllocationService/updateOrderStatus',
          orderId: rawOrderId,
          newStatusId: orderStatusId,
        });
      }
      
      // Lock related warehouse_inventory rows to avoid race conditions on quantity updates
      const keys = dedupeWarehouseBatchKeys(inventoryAllocationDetails);
      await lockRows(client, 'warehouse_inventory', keys, 'FOR UPDATE', {
        context: 'inventory-allocation-service/confirmInventoryAllocationService/lockWarehouseInventory',
        orderId: rawOrderId,
      });
      
      // Fetch current warehouse + reserved quantities for each (warehouse, batch) pair
      const warehouseBatchInfo = await getWarehouseInventoryQuantities(keys, client);
      const inStockStatusId = getStatusId('inventory_in_stock');
      const outOfStockStatusId = getStatusId('inventory_out_of_stock');
      
      // Compute new reserved quantities and updated inventory statuses
      const updates = updateReservedQuantitiesFromAllocations(
        inventoryAllocationDetails,
        warehouseBatchInfo,
        { inStockStatusId, outOfStockStatusId }
      );
      
      // Build keyed update object (by warehouse_id + batch_id) for bulk update
      const updatesObject = Object.fromEntries(
        updates.map((row) => {
          const key = `${row.warehouse_id}-${row.batch_id}`;
          return [key, {
            warehouse_quantity: row.warehouse_quantity,
            reserved_quantity: row.reserved_quantity,
            status_id: row.status_id,
          }];
        })
      );
      
      // Apply bulk update to warehouse_inventory for reserved quantities and statuses
      const updatedWarehouseRecords = await bulkUpdateWarehouseQuantities(updatesObject, userId, client);
      
      // Build and insert inventory activity logs (for auditing reserve actions)
      const inventoryActionTypeId = await getInventoryActionTypeId('reserve', client);
      const inventoryActivityLogs = buildWarehouseInventoryActivityLogsForOrderAllocation(
        updates,
        warehouseBatchInfo,
        {
          orderId: rawOrderId,
          performedBy: userId,
          actionTypeId: inventoryActionTypeId,
        }
      );
      const insertedLogIds = await insertInventoryActivityLogs(inventoryActivityLogs, client);
      
      // Construct structured result for downstream consumers (API response, etc.)
      const rawResult = buildOrderAllocationResult({
        orderId: rawOrderId,
        inventoryAllocations: inventoryAllocationDetails,
        warehouseUpdateIds: updatedWarehouseRecords,
        inventoryLogIds: insertedLogIds,
        allocationResults,
      });
      
      // Set fully matched allocations to ALLOC_CONFIRMED
      const confirmedStatusId = await getInventoryAllocationStatusId('ALLOC_CONFIRMED');
      
      // Set partially matched or unmatched allocations to ALLOC_PARTIAL
      const partialStatusId = await getInventoryAllocationStatusId('ALLOC_PARTIAL');
      
      // Group allocation IDs by status
      const fullyAllocatedIds = allocationResults
        .filter((res) => res.isMatched)
        .map((res) => res.allocationId);
      
      const partialOrUnmatchedIds = allocationResults
        .filter((res) => !res.isMatched)
        .map((res) => res.allocationId);

      // Update fully allocated → CONFIRMED
      if (fullyAllocatedIds.length > 0) {
        const updatedConfirmed = await updateInventoryAllocationStatus({
          statusId: confirmedStatusId,
          userId,
          allocationIds: fullyAllocatedIds,
        }, client);
        
        logSystemInfo('Fully allocated statuses confirmed', {
          context: 'inventory-allocation-service/confirmInventoryAllocationService/updateConfirmedAllocations',
          orderId: rawOrderId,
          updatedAllocationCount: updatedConfirmed.length,
        });
      }

      // Update partial/missing → PARTIAL
      if (partialOrUnmatchedIds.length > 0) {
        const updatedPartial = await updateInventoryAllocationStatus({
          statusId: partialStatusId,
          userId,
          allocationIds: partialOrUnmatchedIds,
        }, client);
        
        logSystemInfo('Partial or backordered allocations updated', {
          context: 'inventory-allocation-service/confirmInventoryAllocationService/updatePartialAllocations',
          orderId: rawOrderId,
          updatedAllocationCount: updatedPartial.length,
        });
      }
      
      // Final step: return transformed result for client-facing consumption
      return transformOrderAllocationResponse(rawResult);
    });
  } catch (error) {
    logSystemException(error, 'Failed to confirm inventory allocation', {
      context: 'inventory-allocation-service/confirmInventoryAllocationService',
      orderId: rawOrderId,
      userId: user?.id,
    });
    throw AppError.serviceError('Unable to confirm inventory allocation for this order.');
  }
};

module.exports = {
  allocateInventoryForOrderService,
  reviewInventoryAllocationService,
  confirmInventoryAllocationService,
};
