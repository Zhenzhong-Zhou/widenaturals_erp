const { withTransaction } = require('../database/db');
const {
  fetchOrderMetadata,
  updateOrderStatus
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
  transformAllocationReviewData
} = require('../transformers/inventory-allocation-transformer');
const { getStatusId } = require('../config/status-cache');
const {
  getAllocatableBatchesByWarehouse,
} = require('../repositories/warehouse-inventory-repository');
const {
  allocateBatchesForOrderItems
} = require('../business/inventory-allocation-business');
const { insertInventoryAllocationsBulk } = require('../repositories/inventory-allocations-repository');
const { logSystemException } = require('../utils/system-logger');
const { getOrderStatusByCode } = require('../repositories/order-status-repository');

/**
 * Allocates inventory batches to each order item using a batch allocation strategy (FEFO/FIFO).
 *
 * This function performs the allocation as a transactional operation:
 * - Validates the current order status
 * - Validates item-level status eligibility
 * - Retrieves in-stock batches for the order's SKUs or packaging materials
 * - Applies the allocation strategy (FEFO/FIFO)
 * - Persists the allocation records in the `inventory_allocations` table
 * - Returns allocation review data (orderId + allocation IDs)
 *
 * @param {Object} user - Authenticated user object (must include `id`)
 * @param {string} rawOrderId - Raw order UUID
 * @param {Object} options - Allocation configuration
 * @param {'fefo'|'fifo'} [options.strategy='fefo'] - Allocation strategy to use
 * @param {string|null} [options.warehouseId=null] - Warehouse to allocate from
 *
 * @returns {Promise<{ orderId: string, allocationIds: string[] }>} Allocation review payload
 *
 * @throws {AppError} If the status transition is invalid or allocation fails
 */
const allocateInventoryForOrder = async (user, rawOrderId, {
  strategy = 'fefo',
  warehouseId = null
}) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
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
      context: 'allocateInventoryForOrder',
      orderId: rawOrderId,
      userId: user?.id,
      strategy,
      warehouseId,
    });
    
    throw AppError.serviceError('Failed to allocate inventory for order.');
  }
};

const reviewInventoryAllocation = async (orderId) => {};


// /**
//  * Confirms inventory allocations for a given sales order.
//  *
//  * This function performs the following:
//  * - Retrieves order items and their allocation details.
//  * - Computes allocation status for each item (full, partial, or backordered).
//  * - Updates order item statuses and the order status accordingly.
//  * - Locks and updates `warehouse_inventory` reserved quantities.
//  * - Creates corresponding inventory activity logs.
//  * - Returns a structured allocation result for downstream use (e.g., API response).
//  *
//  * All operations are executed within a single database transaction to ensure atomicity.
//  *
//  * @param {object} user - The authenticated user performing the allocation.
//  * @param {string} rawOrderId - UUID of the sales order to confirm allocations for.
//  * @returns {Promise<object>} Transformed order allocation result object.
//  * @throws {AppError} If any step in the process fails (e.g., missing data, DB error).
//  */
// const confirmInventoryAllocation = async (user, rawOrderId) => {
//   try {
//     return await withTransaction(async (client) => {
//       const userId = user.id;
//
//       // 1. Fetch order items and allocation details
//       const orderItemsMetadata = await getOrderItemsByOrderId(rawOrderId, client);
//
//       logSystemInfo('Fetched order items for allocation', {
//         context: 'inventory-allocation-service/confirmInventoryAllocation',
//         orderId: rawOrderId,
//         itemCount: orderItemsMetadata.length,
//       });
//
//       if (!orderItemsMetadata.length) {
//         throw AppError.notFoundError(`No order items found for order ID: ${rawOrderId}`);
//       }
//
//       const inventoryAllocationDetails = await getInventoryAllocationsByOrderId(rawOrderId, client);
//
//       // 2. Compute allocation status per item (full, partial, backordered)
//       const allocationResults = computeAllocationStatusPerItem(orderItemsMetadata, inventoryAllocationDetails);
//
//       // 3. Fetch order status IDs for status updates
//       const uniqueStatusCodes = [...new Set(allocationResults.map((res) => res.allocationStatus))];
//       const statusCodeToIdMap = {};
//       for (const code of uniqueStatusCodes) {
//         const { id } = await getOrderStatusByCode(code, client);
//         statusCodeToIdMap[code] = id;
//       }
//
//       // 4. Update each order item's status
//       let hasStatusUpdates = false;
//       for (const { orderItemId, allocationStatus } of allocationResults) {
//         const newStatusId = statusCodeToIdMap[allocationStatus];
//         const updated = await updateOrderItemStatuses(client, {
//           orderId: rawOrderId,
//           newStatusId,
//           updatedBy: userId,
//           orderItemId,
//         });
//
//         if ((updated ?? []).length > 0) {
//           hasStatusUpdates = true;
//         }
//       }
//
//       // 5. If all items are fully allocated, update the order's status
//       const hasUnallocatedItems = allocationResults.some((res) => !res.isMatched);
//       if (!hasUnallocatedItems) {
//         const orderStatusCode = allocationResults[0].allocationStatus;
//         const orderStatusId = statusCodeToIdMap[orderStatusCode];
//
//         await updateOrderStatus(client, {
//           orderId: rawOrderId,
//           newStatusId: orderStatusId,
//           updatedBy: userId,
//         });
//       }
//
//       // 6. Lock warehouse_inventory records based on allocation keys
//       const keys = inventoryAllocationDetails.map(({ warehouse_id, batch_id }) => ({ warehouse_id, batch_id }));
//       await lockRows(client, 'warehouse_inventory', keys, 'FOR UPDATE', {
//         context: 'inventory-allocation-service/lockWarehouseInventory',
//         orderId: rawOrderId,
//       });
//
//       // 7. Fetch current warehouse inventory info
//       const warehouseBatchInfo = await getWarehouseInventoryQuantities(keys, client);
//
//       // 8. Recalculate reserved quantities based on confirmed allocations
//       const inStockStatusId = getStatusId('inventory_in_stock');
//       const outOfStockStatusId = getStatusId('inventory_out_of_stock');
//       const updates = updateReservedQuantitiesFromAllocations(
//         inventoryAllocationDetails,
//         warehouseBatchInfo,
//         { inStockStatusId, outOfStockStatusId }
//       );
//
//       // 9. Format updates into object structure for bulk update
//       const updatesObject = Object.fromEntries(
//         updates.map((row) => {
//           const key = `${row.warehouse_id}-${row.batch_id}`;
//           return [
//             key,
//             {
//               warehouse_quantity: row.warehouse_quantity,
//               reserved_quantity: row.reserved_quantity,
//               status_id: row.status_id,
//             },
//           ];
//         })
//       );
//
//       // 10. Update warehouse inventory
//       const updatedWarehouseRecords = await bulkUpdateWarehouseQuantities(updatesObject, userId, client);
//
//       // 11. Generate and insert inventory activity logs
//       const inventoryActionTypeId = await getInventoryActionTypeId('reserve', client);
//       const inventoryActivityLogs = buildWarehouseInventoryActivityLogsForOrderAllocation(
//         updates,
//         warehouseBatchInfo,
//         {
//           orderId: rawOrderId,
//           performedBy: userId,
//           actionTypeId: inventoryActionTypeId,
//         }
//       );
//       const insertedLogIds = await insertInventoryActivityLogs(inventoryActivityLogs, client);
//
//       // 12. Build and return final allocation result
//       const rawResult = buildOrderAllocationResult({
//         orderId: rawOrderId,
//         inventoryAllocations: inventoryAllocationDetails,
//         warehouseUpdateIds: updatedWarehouseRecords,
//         inventoryLogIds: insertedLogIds,
//         allocationResults,
//       });
//
//       return transformOrderAllocationResponse(rawResult);
//     });
//   } catch (error) {
//     logSystemException(error, 'Failed to confirm inventory allocation', {
//       context: 'inventory-allocation-service/confirmInventoryAllocation',
//       orderId: rawOrderId,
//       userId: user?.id,
//     });
//     throw AppError.serviceError('Unable to confirm inventory allocation for this order.');
//   }
// };

module.exports = {
  allocateInventoryForOrder,
  // confirmInventoryAllocation,
};
