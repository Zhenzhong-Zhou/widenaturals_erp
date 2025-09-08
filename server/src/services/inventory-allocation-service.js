const { withTransaction, lockRows } = require('../database/db');
const {
  fetchOrderMetadata,
  updateOrderStatus,
  getInventoryAllocationsByOrderId
} = require('../repositories/order-repository');
const { validateStatusTransitionByCategory } = require('../business/order-business');
const {
  getOrderItemsByOrderId,
  updateOrderItemStatusesByOrderId,
  updateOrderItemStatus
} = require('../repositories/order-item-repository');
const AppError = require('../utils/AppError');
const {
  extractOrderItemIdsByType,
  transformAllocationResultToInsertRows,
  transformAllocationReviewData,
  transformInventoryAllocationReviewRows,
  transformOrderAllocationResponse,
  transformPaginatedInventoryAllocationResults,
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
  updateInventoryAllocationStatus,
  getPaginatedInventoryAllocations
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
      
      await updateOrderItemStatusesByOrderId(client, {
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
 * Service function to fetch paginated inventory allocation summaries with support for
 * dynamic filtering, pagination, and sorting. Wraps repository logic, applies transformations,
 * handles errors, and logs system activity.
 *
 * Internally:
 * 1. Retrieves paginated rows from the database via repository.
 * 2. Transforms raw SQL rows into client-facing structure.
 * 3. Logs info-level system events and exceptions.
 * 4. Returns paginated result or fallback empty response if no data.
 *
 * @param {Object} params - Input parameters
 * @param {Object} [params.filters={}] - Filtering criteria (e.g., warehouseId, statusId, orderTypeId, keyword)
 * @param {number} [params.page=1] - Current page number (1-based)
 * @param {number} [params.limit=10] - Number of records per page
 * @param {string} [params.sortBy='created_at'] - Sortable field (must match allowed keys)
 * @param {string} [params.sortOrder='DESC'] - Sort direction: 'ASC' or 'DESC'
 *
 * @returns {Promise<{
 *   data: InventoryAllocationSummary[],
 *   pagination: {
 *     page: number,
 *     limit: number,
 *     totalRecords: number,
 *     totalPages: number
 *   }
 * }>} Paginated and transformed result set
 *
 * @throws {AppError} When an internal service or database error occurs
 */
const fetchPaginatedInventoryAllocationsService = async ({
                                                           filters = {},
                                                           page = 1,
                                                           limit = 10,
                                                           sortBy = 'created_at',
                                                           sortOrder = 'DESC',
                                                         }) => {
  try {
    // Step 1: Query raw paginated allocation rows from repository layer
    const rawResult = await getPaginatedInventoryAllocations({
      filters,
      page,
      limit,
      sortBy,
      sortOrder,
    });
    
    // Step 2: If no data, log and return empty result with pagination fallback
    if (!rawResult || rawResult.length === 0) {
      logSystemInfo('No inventory allocation records found', {
        context: 'inventory-allocations-service/fetchPaginatedInventoryAllocationsService',
        filters,
        pagination: { page, limit },
        sort: { sortBy, sortOrder },
      });
      
      return {
        data: [],
        pagination: {
          page,
          limit,
          totalRecords: 0,
          totalPages: 0,
        },
      };
    }
    
    // Step 3: Transform raw SQL rows into clean API-ready objects
    const result = transformPaginatedInventoryAllocationResults(rawResult);
    
    // Step 4: Log successful response for auditing/metrics
    logSystemInfo('Fetched paginated inventory allocations', {
      context: 'inventory-allocations-service/fetchPaginatedInventoryAllocationsService',
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });
    
    return result;
  } catch (error) {
    // Step 5: Log exception and rethrow as service-level error
    logSystemException(error, 'Failed to fetch paginated inventory allocations', {
      context: 'inventory-allocations-service/fetchPaginatedInventoryAllocationsService',
      filters,
      pagination: { page, limit },
      sort: { sortBy, sortOrder },
    });
    
    throw AppError.serviceError('Could not fetch inventory allocations. Please try again.');
  }
};

/**
 * Confirms inventory allocations for a given sales order.
 *
 * ## Core Responsibilities
 * This service performs a multistep confirmation process under a single transaction:
 * - Locks the target sales order row to prevent concurrent updates.
 * - Locks associated order items and retrieves their metadata.
 * - Fetches all inventory allocations related to the order.
 * - Computes allocation results per order item (fully matched or partially matched).
 * - Updates individual order item statuses based on allocation outcomes.
 * - Updates the overall order status if all items are fully allocated.
 * - Locks related `warehouse_inventory` records for quantity updates.
 * - Recomputes and updates reserved quantities and inventory statuses in `warehouse_inventory`.
 * - Updates inventory allocation statuses to `ALLOC_CONFIRMED` or `ALLOC_PARTIAL` as appropriate.
 * - Inserts audit logs into the inventory activity log table for traceability (e.g., "reserve" action).
 * - Returns a fully transformed allocation result for API or downstream consumers.
 *
 * ## Transactional Guarantees
 * All operations are wrapped in a single transaction via `withTransaction(...)`, ensuring atomicity:
 * - Inventory reservations, allocation statuses, and order statuses will never become inconsistent mid-process.
 *
 * ## Performance and Concurrency Notes
 * - Uses `FOR UPDATE` row-level locks on `orders`, `order_items`, and `warehouse_inventory` to ensure safe concurrent execution.
 * - Leverages bulk update operations for performance where applicable.
 * - Requires indexes on keys like `order_id`, `order_item_id`, `status_id`, and `(warehouse_id, batch_id)` for optimal query performance.
 * - Assumes allocation logic has been resolved prior to confirmation (i.e., no on-the-fly inventory resolution).
 *
 * @function
 * @param {object} user - The authenticated user triggering the confirmation; must include `id`.
 * @param {string} rawOrderId - The UUID of the sales order whose inventory allocations should be confirmed.
 * @returns {Promise<object>} A transformed allocation result containing:
 *   - Finalized inventory allocations
 *   - Updated warehouse inventory references
 *   - Inserted inventory activity log IDs
 *   - Order allocation summary
 * @throws {AppError} If order or order items are missing, or if inventory updates fail.
 */
const confirmInventoryAllocationService = async (user, rawOrderId) => {
  try {
    return await withTransaction(async (client) => {
      const userId = user.id;
      
      // --- 1. Lock core rows ---
      await lockRows(client, 'orders', [rawOrderId], 'FOR UPDATE', {
        context: 'inventory-allocation-service/confirmInventoryAllocationService/lockOrder',
      });
      
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
      
      // --- 2. Fetch and compute allocation statuses ---
      const inventoryAllocationDetails = await getInventoryAllocationsByOrderId(rawOrderId, client);
      const allocationResults = computeAllocationStatusPerItem(orderItemsMetadata, inventoryAllocationDetails);
      
      const uniqueStatusCodes = [...new Set(allocationResults.map(res => res.allocationStatus))];
      const statusList = await getOrderStatusesByCodes(uniqueStatusCodes, client);
      const statusCodeToIdMap = Object.fromEntries(statusList.map(({ code, id }) => [code, id]));
      
      // --- 3. Update order_items statuses ---
      let hasStatusUpdates = false;
      for (const { orderItemId, allocationStatus } of allocationResults) {
        const newStatusId = statusCodeToIdMap[allocationStatus];
        const updated = await updateOrderItemStatus(client, {
          orderItemId,
          newStatusId,
          updatedBy: userId,
        });
        if (updated) hasStatusUpdates = true;
      }
      
      // --- 4. Update order status if fully allocated ---
      const hasUnallocatedItems = allocationResults.some(res => !res.isMatched);
      if (!hasUnallocatedItems) {
        const orderStatusCode = allocationResults[0].allocationStatus;
        const orderStatusId = statusCodeToIdMap[orderStatusCode];
        await updateOrderStatus(client, {
          orderId: rawOrderId,
          newStatusId: orderStatusId,
          updatedBy: userId,
        });
        logSystemInfo('Order status updated based on fully matched allocations', {
          context: 'inventory-allocation-service/confirmInventoryAllocationService/updateOrderStatus',
          orderId: rawOrderId,
          newStatusId: orderStatusId,
        });
      }
      
      // --- 5. Lock warehouse_inventory for quantity updates ---
      const keys = dedupeWarehouseBatchKeys(inventoryAllocationDetails);
      await lockRows(client, 'warehouse_inventory', keys, 'FOR UPDATE', {
        context: 'inventory-allocation-service/confirmInventoryAllocationService/lockWarehouseInventory',
        orderId: rawOrderId,
      });
      
      const warehouseBatchInfo = await getWarehouseInventoryQuantities(keys, client);
      const inStockStatusId = getStatusId('inventory_in_stock');
      const outOfStockStatusId = getStatusId('inventory_out_of_stock');
      
      // --- 6. Compute reserved qty + statuses ---
      const updates = updateReservedQuantitiesFromAllocations(
        inventoryAllocationDetails,
        warehouseBatchInfo,
        { inStockStatusId, outOfStockStatusId }
      );
      
      const updatesObject = Object.fromEntries(updates.map(row => [`${row.warehouse_id}-${row.batch_id}`, {
        warehouse_quantity: row.warehouse_quantity,
        reserved_quantity: row.reserved_quantity,
        status_id: row.status_id,
      }]));
      
      // --- 7. Apply bulk warehouse inventory updates ---
      const updatedWarehouseRecords = await bulkUpdateWarehouseQuantities(updatesObject, userId, client);
      
      // --- 8. Confirm or partial allocation status update ---
      const confirmedStatusId = await getInventoryAllocationStatusId('ALLOC_CONFIRMED');
      const partialStatusId = await getInventoryAllocationStatusId('ALLOC_PARTIAL');
      
      const fullyMatchedItemIds = new Set(allocationResults.filter(r => r.isMatched).map(r => r.orderItemId));
      const cleanFullyAllocatedIds = inventoryAllocationDetails
        .filter(detail => fullyMatchedItemIds.has(detail.order_item_id))
        .map(detail => detail.allocation_id)
        .filter(Boolean);
      
      const partiallyMatchedItemIds = new Set(allocationResults.filter(r => !r.isMatched).map(r => r.orderItemId));
      const cleanPartialOrUnmatchedIds = inventoryAllocationDetails
        .filter(detail => partiallyMatchedItemIds.has(detail.order_item_id))
        .map(detail => detail.allocation_id)
        .filter(Boolean);
      
      if (cleanFullyAllocatedIds.length > 0) {
        const updatedConfirmed = await updateInventoryAllocationStatus({
          statusId: confirmedStatusId,
          userId,
          allocationIds: cleanFullyAllocatedIds,
        }, client);
        logSystemInfo('Fully allocated statuses confirmed', {
          context: 'inventory-allocation-service/confirmInventoryAllocationService/updateConfirmedAllocations',
          orderId: rawOrderId,
          updatedAllocationCount: updatedConfirmed.length,
        });
      }
      
      if (cleanPartialOrUnmatchedIds.length > 0) {
        const updatedPartial = await updateInventoryAllocationStatus({
          statusId: partialStatusId,
          userId,
          allocationIds: cleanPartialOrUnmatchedIds,
        }, client);
        logSystemInfo('Partial or backordered allocations updated', {
          context: 'inventory-allocation-service/confirmInventoryAllocationService/updatePartialAllocations',
          orderId: rawOrderId,
          updatedAllocationCount: updatedPartial.length,
        });
      }
      
      // --- 9. Insert inventory activity logs ---
      const inventoryActionTypeId = await getInventoryActionTypeId('reserve', client);
      const inventoryActivityLogs = buildWarehouseInventoryActivityLogsForOrderAllocation(
        updates,
        warehouseBatchInfo,
        { orderId: rawOrderId, performedBy: userId, actionTypeId: inventoryActionTypeId }
      );
      const insertedLogIds = await insertInventoryActivityLogs(inventoryActivityLogs, client);
      
      // --- 10. Final transformation and return ---
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
    
    // Pass through original conflict error if exists
    if (error instanceof AppError && error.type === 'ConflictError') {
      throw error; // pass it through so client gets detailed message
    }
    
    throw AppError.serviceError('Unable to confirm inventory allocation for this order.');
  }
};

module.exports = {
  allocateInventoryForOrderService,
  reviewInventoryAllocationService,
  fetchPaginatedInventoryAllocationsService,
  confirmInventoryAllocationService,
};
