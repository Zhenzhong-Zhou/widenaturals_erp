const { withTransaction, lockRows } = require('../database/db');
const {
  fetchOrderMetadata,
  updateOrderStatus,
  getInventoryAllocationsByOrderId
} = require('../repositories/order-repository');
const { validateStatusTransitionByCategory } = require('../business/order-business');
const {
  getOrderItemsByOrderId,
  updateOrderItemStatuses
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
  getInventoryAllocationReview
} = require('../repositories/inventory-allocations-repository');
const {
  logSystemException,
  logSystemInfo,
  logSystemWarn
} = require('../utils/system-logger');
const { getOrderStatusByCode } = require('../repositories/order-status-repository');
const { getInventoryActionTypeId } = require('../repositories/inventory-action-type-repository');
const { insertInventoryActivityLogs } = require('../repositories/inventory-log-repository');

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
 * This function performs the following:
 * 1. Validates that each allocationId belongs to the given order.
 * 2. If mismatches are found, throws a validation error with the mismatched IDs.
 * 3. Fetches raw allocation review data from the database.
 * 4. Transforms the raw data into structured frontend-friendly format.
 * 5. Throws a service error if any step fails.
 *
 * @async
 *
 * @param {string} orderId - The UUID of the order being reviewed.
 * @param {string[]} allocationIds - List of allocation UUIDs to validate and review.
 *
 * @returns {Promise<InventoryAllocationReviewRow|null>} - Structured review result including order metadata and allocation items, or `null` if no data is found.
 *
 * @throws {AppError} - Throws validationError if mismatches are found,
 *                      or serviceError on internal failure.
 */
const reviewInventoryAllocationService = async (orderId, allocationIds) => {
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

    const rawReviewData = await getInventoryAllocationReview(orderId, allocationIds);

    if (!rawReviewData || rawReviewData.length === 0) {
      return null;
    }

    return transformInventoryAllocationReviewRows(rawReviewData);
  } catch (error) {
    logSystemException(error, 'Failed to review inventory for order', {
      context: 'inventory-allocation-service/reviewInventoryAllocationService',
      orderId,
      allocationIds,
    });
    throw AppError.serviceError('Failed to review inventory for order.');
  }
};

/**
 * Confirms inventory allocations for a given sales order.
 *
 * This function performs the following operations atomically:
 * - Locks the `orders` row to prevent conflicting status updates.
 * - Locks the related `order_items` rows before evaluating and updating item statuses.
 * - Retrieves order items and their inventory allocation details.
 * - Computes allocation status for each item (full, partial, or backordered).
 * - Updates item statuses individually, and the order status if applicable.
 * - Locks corresponding `warehouse_inventory` rows to ensure consistency when adjusting reserved quantities.
 * - Applies reserved quantity and inventory status changes.
 * - Creates inventory activity logs for traceability.
 * - Returns a structured allocation result for downstream consumers (e.g., API response).
 *
 * All steps are executed within a single transaction to ensure consistency and isolation.
 *
 * @param {object} user - The authenticated user performing the allocation.
 * @param {string} rawOrderId - UUID of the sales order to confirm allocations for.
 * @returns {Promise<object>} Transformed order allocation result object.
 * @throws {AppError} If any step in the process fails (e.g., missing data, status conflict, or DB error).
 */
const confirmInventoryAllocationService = async (user, rawOrderId) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      // Lock order row to prevent race conditions on status update
      await lockRows(client, 'orders', [rawOrderId], 'FOR UPDATE', {
        context: 'inventory-allocation-service/confirmInventoryAllocationService/lockOrder',
      });
      
      // Fetch and lock order items for the order
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
      
      if (!orderItemsMetadata.length) {
        throw AppError.notFoundError(`No order items found for order ID: ${rawOrderId}`);
      }
      
      // Retrieve allocation records for the order
      const inventoryAllocationDetails = await getInventoryAllocationsByOrderId(rawOrderId, client);
      
      // Compute allocation result per item
      const allocationResults = computeAllocationStatusPerItem(orderItemsMetadata, inventoryAllocationDetails);
      
      // Lookup status IDs needed for updates
      const uniqueStatusCodes = [...new Set(allocationResults.map((res) => res.allocationStatus))];
      const statusCodeToIdMap = {};
      for (const code of uniqueStatusCodes) {
        const { id } = await getOrderStatusByCode(code, client);
        statusCodeToIdMap[code] = id;
      }
      
      // Update item statuses
      let hasStatusUpdates = false;
      for (const { orderItemId, allocationStatus } of allocationResults) {
        const newStatusId = statusCodeToIdMap[allocationStatus];
        const updated = await updateOrderItemStatuses(client, {
          orderId: rawOrderId,
          newStatusId,
          updatedBy: userId,
          orderItemId,
        });
        
        if ((updated ?? []).length > 0) {
          hasStatusUpdates = true;
        }
      }
      
      // Conditionally update order status (only if all items matched)
      const hasUnallocatedItems = allocationResults.some((res) => !res.isMatched);
      if (!hasUnallocatedItems) {
        const orderStatusCode = allocationResults[0].allocationStatus;
        const orderStatusId = statusCodeToIdMap[orderStatusCode];
        
        await updateOrderStatus(client, {
          orderId: rawOrderId,
          newStatusId: orderStatusId,
          updatedBy: userId,
        });
      }
      
      // Lock affected warehouse_inventory rows before update
      const keys = inventoryAllocationDetails.map(({ warehouse_id, batch_id }) => ({ warehouse_id, batch_id }));
      await lockRows(client, 'warehouse_inventory', keys, 'FOR UPDATE', {
        context: 'inventory-allocation-service/confirmInventoryAllocationService/lockWarehouseInventory',
        orderId: rawOrderId,
      });
      
      // Get current quantities and compute new reserved + status values
      const warehouseBatchInfo = await getWarehouseInventoryQuantities(keys, client);
      const inStockStatusId = getStatusId('inventory_in_stock');
      const outOfStockStatusId = getStatusId('inventory_out_of_stock');
      
      const updates = updateReservedQuantitiesFromAllocations(
        inventoryAllocationDetails,
        warehouseBatchInfo,
        { inStockStatusId, outOfStockStatusId }
      );
      
      // Prepare bulk update object
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
      
      // Apply bulk update to warehouse inventory
      const updatedWarehouseRecords = await bulkUpdateWarehouseQuantities(updatesObject, userId, client);
      
      // Insert inventory activity logs for traceability
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
      
      // Build and return the result
      const rawResult = buildOrderAllocationResult({
        orderId: rawOrderId,
        inventoryAllocations: inventoryAllocationDetails,
        warehouseUpdateIds: updatedWarehouseRecords,
        inventoryLogIds: insertedLogIds,
        allocationResults,
      });
      
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
