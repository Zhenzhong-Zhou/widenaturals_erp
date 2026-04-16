/**
 * @file inventory-allocation-service.js
 * @description Business logic for inventory allocation lifecycle operations.
 *
 * Exports:
 *   - allocateInventoryForOrderService          — allocates inventory batches to order items using FEFO/FIFO strategy
 *   - reviewInventoryAllocationService          — retrieves full allocation review data for an order
 *   - fetchPaginatedInventoryAllocationsService — paginated allocation list with ACL-scoped warehouse filtering
 *   - confirmInventoryAllocationService         — confirms allocations, updates reserved warehouse quantities,
 *                                                 recalculates inventory status, and inserts activity logs
 *
 * ACL:
 *   - allocateInventoryForOrderService          — validates user has access to the requested warehouseId
 *                                                 before entering the transaction.
 *   - fetchPaginatedInventoryAllocationsService — evaluates warehouse visibility per user and injects
 *                                                 warehouse scope into filters before querying.
 *   - reviewInventoryAllocationService          — intersects requested warehouseIds with user's assigned
 *                                                 warehouses before fetching allocation review data.
 *   - confirmInventoryAllocationService         — no additional ACL; warehouse scope is implicitly
 *                                                 enforced by the allocation records already scoped
 *                                                 to the order.
 *
 * Error handling follows a single-log principle — errors are not logged here.
 * They bubble up to globalErrorHandler, which logs once with the normalised shape.
 *
 * AppErrors thrown by lower layers are re-thrown as-is.
 * Unexpected errors are wrapped in AppError.serviceError before bubbling up.
 */

'use strict';

const { withTransaction } = require('../database/db');
const { lockRows } = require('../utils/db/lock-modes');
const {
  fetchOrderMetadata,
  updateOrderStatus,
  getInventoryAllocationsByOrderId,
} = require('../repositories/order-repository');
const {
  validateStatusTransitionByCategory,
} = require('../business/order-business');
const {
  getOrderItemsByOrderId,
  updateOrderItemStatusesByOrderId,
  updateOrderItemStatus,
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
  updateWarehouseInventoryQuantityBulk,
} = require('../repositories/warehouse-inventory-repository');
const {
  allocateBatchesForOrderItems,
  computeAllocationStatusPerItem,
  updateReservedQuantitiesFromAllocations,
  buildOrderAllocationResult,
  validateAllocationStatusTransition,
  resolveOrderItemDisplay,
  evaluateInventoryAllocationVisibility,
  applyInventoryAllocationVisibilityRules,
  dedupeWarehouseBatchKeys,
} = require('../business/inventory-allocation-business');
const {
  insertInventoryAllocationsBulk,
  getMismatchedAllocationIds,
  getInventoryAllocationReview,
  updateInventoryAllocationStatus,
  getPaginatedInventoryAllocations,
  getAllocationStatuses,
} = require('../repositories/inventory-allocations-repository');
const { logSystemWarn } = require('../utils/logging/system-logger');
const {
  getOrderStatusByCode,
  getOrderStatusesByCodes,
} = require('../repositories/order-status-repository');
const {
  getInventoryActionTypeId,
} = require('../repositories/inventory-action-type-repository');
const {
  getInventoryAllocationStatusId,
} = require('../repositories/inventory-allocation-status-repository');
const {
  insertInventoryActivityLogBulk,
} = require('../repositories/inventory-activity-log-repository');
const {
  buildAllocationConfirmLogEntries,
  assertWarehouseAccess,
  enforceWarehouseScope,
} = require('../business/warehouse-inventory-business');

const CONTEXT = 'inventory-allocation-service';

/**
 * Allocates inventory batches to order items using the specified strategy.
 *
 * Enforces warehouse access before entering the transaction. Locks order,
 * order items, and warehouse inventory rows for the duration of the transaction.
 * Validates status transitions, applies the allocation strategy, inserts
 * allocation records, and updates order and item statuses.
 *
 * @param {object}  user                          - Authenticated user (requires `id` and permissions).
 * @param {string}  rawOrderId                    - UUID of the order to allocate.
 * @param {object}  options
 * @param {string}  [options.strategy='fefo']     - Allocation strategy (`'fefo'` or `'fifo'`).
 * @param {string}  options.warehouseId           - UUID of the warehouse to allocate from (access validated).
 * @param {boolean} [options.allowPartial=false]  - Whether partial allocation is permitted.
 *
 * @returns {Promise<object>} Transformed allocation review data for the order.
 *
 * @throws {AppError} `validationError`  — missing warehouseId, warehouse access denied,
 *                                         invalid item statuses, or insufficient inventory.
 * @throws {AppError} `notFoundError`    — no order items found for the order.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `serviceError`.
 */
const allocateInventoryForOrderService = async (
  user,
  rawOrderId,
  { strategy = 'fefo', warehouseId, allowPartial = false }
) => {
  const context = `${CONTEXT}/allocateInventoryForOrderService`;

  if (!warehouseId) {
    throw AppError.validationError('Warehouse ID is required for allocation.');
  }

  // Enforce warehouse access before entering the transaction.
  const assignedWarehouseIds = await assertWarehouseAccess(user);
  enforceWarehouseScope(assignedWarehouseIds, warehouseId);

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

      const orderItemsMetadata = await getOrderItemsByOrderId(orderId, client);
      const orderItemIds = orderItemsMetadata.map((item) => item.order_item_id);
      const orderItemMap = new Map(
        orderItemsMetadata.map((item) => [item.order_item_id, item])
      );

      // Lock order_items rows before validating statuses.
      await lockRows(client, 'order_items', orderItemIds, 'FOR UPDATE', {
        context: `${context}/lockOrderItems`,
      });

      if (!orderItemsMetadata.length) {
        throw AppError.notFoundError(
          `No order items found for order ID: ${orderId}`
        );
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

      const { skuIds, packagingMaterialIds } =
        extractOrderItemIdsByType(orderItemsMetadata);
      const inStockStatusId = getStatusId('inventory_in_stock');

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

      // Lock warehouse_inventory rows before reading quantities.
      const warehouseInventoryLockConditions = batches.map((batch) => ({
        warehouse_id: batch.warehouse_id,
        batch_id: batch.batch_id,
      }));

      await lockRows(
        client,
        'warehouse_inventory',
        warehouseInventoryLockConditions,
        'FOR UPDATE',
        {
          context: `${context}/lockWarehouseInventory`,
        }
      );

      const allocationResult = allocateBatchesForOrderItems(
        orderItemsMetadata,
        batches,
        strategy
      );

      const missingBatchItems = allocationResult.filter(
        (item) =>
          !item.allocated.allocatedBatches ||
          item.allocated.allocatedBatches.length === 0
      );

      if (missingBatchItems.length > 0) {
        const items = missingBatchItems.map((item) => {
          const meta = orderItemMap.get(item.order_item_id);
          const { itemCode, itemName } = resolveOrderItemDisplay(meta);
          return {
            itemCode,
            itemName,
            requestedQuantity: item.quantity_ordered,
          };
        });

        throw AppError.validationError(
          'No inventory batches are available in the selected warehouse for some items.',
          { code: 'NO_WAREHOUSE_INVENTORY', details: { items } }
        );
      }

      const insufficientItems = allocationResult
        .filter((item) => item.allocated.allocatedTotal < item.quantity_ordered)
        .map((item) => {
          const meta = orderItemMap.get(item.order_item_id);
          const { itemCode, itemName } = resolveOrderItemDisplay(meta);
          const firstBatch = item.allocated.allocatedBatches?.[0];

          return {
            itemCode,
            itemName,
            warehouseName: firstBatch?.warehouse_name ?? null,
            lotNumber: firstBatch?.lot_number ?? null,
            requestedQuantity: item.quantity_ordered,
            allocatedQuantity: item.allocated.allocatedTotal,
            missingQuantity:
              item.quantity_ordered - item.allocated.allocatedTotal,
          };
        });

      if (insufficientItems.length > 0 && !allowPartial) {
        throw AppError.validationError(
          'Some items cannot be fully allocated due to insufficient inventory.',
          {
            code: 'INSUFFICIENT_INVENTORY',
            details: { items: insufficientItems, canAllowPartial: true },
          }
        );
      }

      const inventoryAllocationStatusPendingId = getStatusId(
        'inventory_allocation_init'
      );
      const allocations = transformAllocationResultToInsertRows(
        allocationResult,
        {
          status_id: inventoryAllocationStatusPendingId,
          created_by: userId,
        }
      );

      const rawAllocations = await insertInventoryAllocationsBulk(
        allocations,
        client
      );

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
 * Evaluates warehouse visibility for the requesting user and intersects the
 * requested warehouseIds with assigned warehouses before fetching. Validates
 * that provided allocation IDs belong to the order. Returns `null` if no
 * review data is found or the user has no warehouse access.
 *
 * @param {object}   user           - Authenticated user (requires `id` and permissions).
 * @param {string}   orderId        - UUID of the order.
 * @param {string[]} warehouseIds   - Warehouse IDs to scope the review (intersected with user access).
 * @param {string[]} allocationIds  - Allocation IDs to filter by (maybe empty).
 *
 * @returns {Promise<object|null>} Transformed review data or `null` if none found.
 *
 * @throws {AppError} `validationError`  — allocation IDs do not belong to the order.
 * @throws {AppError} `businessError`    — warehouse visibility evaluation failed.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `serviceError`.
 */
const reviewInventoryAllocationService = async (
  user,
  orderId,
  warehouseIds,
  allocationIds
) => {
  const context = `${CONTEXT}/reviewInventoryAllocationService`;

  try {
    const access = await evaluateInventoryAllocationVisibility(user);
    const adjustedFilters = applyInventoryAllocationVisibilityRules(
      { warehouseIds },
      access
    );

    if (adjustedFilters.forceEmptyResult) return null;

    const scopedWarehouseIds = adjustedFilters.warehouseIds ?? [];

    if (allocationIds.length > 0) {
      const mismatches = await getMismatchedAllocationIds(
        orderId,
        allocationIds,
        null
      );

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

    const rawReviewData = await getInventoryAllocationReview(
      orderId,
      scopedWarehouseIds,
      allocationIds,
      null
    );

    if (!rawReviewData || rawReviewData.length === 0) return null;

    return transformInventoryAllocationReviewRows(rawReviewData);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError(
      'Unable to retrieve inventory allocation review.'
    );
  }
};

/**
 * Fetches paginated inventory allocation records with optional filtering and sorting.
 *
 * Evaluates warehouse visibility for the requesting user and injects warehouse
 * scope into filters before querying. Users without full warehouse access are
 * restricted to allocations belonging to their assigned warehouses only.
 *
 * @param {object}        options
 * @param {object}        [options.filters={}]              - Field filters to apply.
 * @param {number}        [options.page=1]                  - Page number (1-based).
 * @param {number}        [options.limit=10]                - Records per page.
 * @param {string}        [options.sortBy='orderDate']      - Sort field key (camelCase, validated against inventoryAllocationSortMap).
 * @param {'ASC'|'DESC'}  [options.sortOrder='DESC']        - Sort direction.
 * @param {object}        options.user                      - Authenticated user (requires `id` and permissions).
 *
 * @returns {Promise<PaginatedResult<InventoryAllocationRow>>}
 *
 * @throws {AppError} `businessError`  — warehouse visibility evaluation failed.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `serviceError`.
 */
const fetchPaginatedInventoryAllocationsService = async ({
  filters = {},
  page = 1,
  limit = 10,
  sortBy = 'orderDate',
  sortOrder = 'DESC',
  user,
}) => {
  const context = `${CONTEXT}/fetchPaginatedInventoryAllocationsService`;

  try {
    const access = await evaluateInventoryAllocationVisibility(user);

    const adjustedFilters = applyInventoryAllocationVisibilityRules(
      filters,
      access
    );

    if (adjustedFilters.forceEmptyResult) {
      return {
        data: [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }

    const rawResult = await getPaginatedInventoryAllocations({
      filters: adjustedFilters,
      page,
      limit,
      sortBy,
      sortOrder,
    });

    if (!rawResult?.data?.length) {
      return {
        data: [],
        pagination: { page, limit, totalRecords: 0, totalPages: 0 },
      };
    }

    return transformPaginatedInventoryAllocationResults(rawResult);
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError(
      'Unable to retrieve inventory allocation records at this time.',
      {
        context,
        meta: { error: error.message },
      }
    );
  }
};

/**
 * Confirms pending inventory allocations, updates reserved warehouse quantities,
 * recalculates inventory status, updates order and item statuses, and inserts
 * inventory activity logs — all within a single transaction.
 *
 * Flow:
 *  1. Lock order and order item rows.
 *  2. Validate allocation status transitions to ALLOC_CONFIRMED.
 *  3. Compute per-item allocation status.
 *  4. Update order item and order statuses.
 *  5. Lock warehouse_inventory rows for affected (warehouse, batch) pairs.
 *  6. Compute updated reserved quantities and resolve inventory status per row.
 *  7. Bulk update warehouse_inventory rows (reserved_quantity, status_id).
 *  8. Update inventory allocation statuses (confirmed or partial).
 *  9. Build and insert inventory activity logs for each reservation change.
 * 10. Build and return transformed allocation confirmation response.
 *
 * @param {object} user          - Authenticated user (requires `id`).
 * @param {string} rawOrderId    - UUID of the order to confirm allocations for.
 *
 * @returns {Promise<object>} Transformed allocation confirmation response.
 *
 * @throws {AppError} `notFoundError`   — no order items found for the order.
 * @throws {AppError} `conflictError`   — allocation quantity exceeds available stock.
 * @throws {AppError} `validationError` — invalid allocation status transition.
 * @throws {AppError} Re-throws all other AppErrors from lower layers unchanged.
 * @throws {AppError} Wraps unexpected errors as `serviceError`.
 */
const confirmInventoryAllocationService = async (user, rawOrderId) => {
  const context = `${CONTEXT}/confirmInventoryAllocationService`;

  try {
    return await withTransaction(async (client) => {
      const userId = user.id;

      // 1. Lock order and order items rows before any reads.
      await lockRows(client, 'orders', [rawOrderId], 'FOR UPDATE', {
        context: `${context}/lockOrder`,
      });

      const orderItemsMetadata = await getOrderItemsByOrderId(
        rawOrderId,
        client
      );
      const orderItemIds = orderItemsMetadata.map((item) => item.order_item_id);

      await lockRows(client, 'order_items', orderItemIds, 'FOR UPDATE', {
        context: `${context}/lockOrderItems`,
        orderId: rawOrderId,
      });

      if (!orderItemsMetadata.length) {
        throw AppError.notFoundError(
          `No order items found for order ID: ${rawOrderId}`
        );
      }

      // 2. Validate each allocation status can transition to ALLOC_CONFIRMED.
      const allocationStatuses = await getAllocationStatuses(
        rawOrderId,
        orderItemIds,
        client
      );

      allocationStatuses.forEach(({ allocation_status_code: code }) => {
        validateAllocationStatusTransition(code, 'ALLOC_CONFIRMED');
      });

      const orderId = allocationStatuses[0]?.order_id;

      // 3. Fetch allocations and compute per-item allocation status.
      const inventoryAllocationDetails = await getInventoryAllocationsByOrderId(
        orderId,
        client
      );
      const allocationResults = computeAllocationStatusPerItem(
        orderItemsMetadata,
        inventoryAllocationDetails
      );

      const uniqueStatusCodes = [
        ...new Set(allocationResults.map((res) => res.allocationStatus)),
      ];
      const statusList = await getOrderStatusesByCodes(
        uniqueStatusCodes,
        client
      );
      const statusCodeToIdMap = Object.fromEntries(
        statusList.map(({ code, id }) => [code, id])
      );

      // 4. Update order item statuses based on allocation results.
      for (const { orderItemId, allocationStatus } of allocationResults) {
        const newStatusId = statusCodeToIdMap[allocationStatus];
        await updateOrderItemStatus(client, {
          orderItemId,
          newStatusId,
          updatedBy: userId,
        });
      }

      // 5. Update order status if fully allocated.
      const hasUnallocatedItems = allocationResults.some(
        (res) => !res.isMatched
      );

      if (!hasUnallocatedItems) {
        const orderStatusCode = allocationResults[0].allocationStatus;
        const orderStatusId = statusCodeToIdMap[orderStatusCode];
        await updateOrderStatus(client, {
          orderId: rawOrderId,
          newStatusId: orderStatusId,
          updatedBy: userId,
        });
      }

      // 6. Lock warehouse_inventory rows before reading quantities.
      const keys = dedupeWarehouseBatchKeys(inventoryAllocationDetails);
      await lockRows(client, 'warehouse_inventory', keys, 'FOR UPDATE', {
        context: `${context}/lockWarehouseInventory`,
        orderId: rawOrderId,
      });

      const warehouseBatchInfo = await getWarehouseInventoryQuantities(
        keys,
        client
      );
      const inStockStatusId = getStatusId('inventory_in_stock');
      const outOfStockStatusId = getStatusId('inventory_out_of_stock');

      // 7. Compute updated reserved quantities and inventory statuses.
      const updates = updateReservedQuantitiesFromAllocations(
        inventoryAllocationDetails,
        warehouseBatchInfo,
        { inStockStatusId, outOfStockStatusId }
      );

      // 8. Apply bulk warehouse inventory updates.
      const updateInputs = updates.map((row) => ({
        id: row.id,
        warehouseQuantity: row.warehouse_quantity,
        reservedQuantity: row.reserved_quantity,
        statusId: row.status_id,
      }));

      const updatedWarehouseRecords =
        await updateWarehouseInventoryQuantityBulk(
          updateInputs,
          userId,
          client
        );

      // 9. Resolve confirmed and partial allocation IDs and update statuses.
      const confirmedStatusId = await getInventoryAllocationStatusId(
        'ALLOC_CONFIRMED',
        client
      );
      const partialStatusId = await getInventoryAllocationStatusId(
        'ALLOC_PARTIAL',
        client
      );

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
          {
            statusId: confirmedStatusId,
            userId,
            allocationIds: cleanFullyAllocatedIds,
          },
          client
        );
      }

      if (cleanPartialOrUnmatchedIds.length > 0) {
        await updateInventoryAllocationStatus(
          {
            statusId: partialStatusId,
            userId,
            allocationIds: cleanPartialOrUnmatchedIds,
          },
          client
        );
      }

      // 10. Build and insert inventory activity logs.
      const inventoryActionTypeId = await getInventoryActionTypeId(
        'reserve',
        client
      );

      const inventoryActivityLogs = buildAllocationConfirmLogEntries(
        updates,
        warehouseBatchInfo,
        {
          orderId: rawOrderId,
          performedBy: userId,
          actionTypeId: inventoryActionTypeId,
        }
      );

      const logInsertResult = await insertInventoryActivityLogBulk(
        inventoryActivityLogs,
        client,
        { context }
      );

      // 11. Build and return final response.
      const rawResult = buildOrderAllocationResult({
        orderId: rawOrderId,
        inventoryAllocations: inventoryAllocationDetails.map(
          ({ allocation_id }) => ({ allocation_id })
        ),
        warehouseUpdateIds: updatedWarehouseRecords.map((r) => ({ id: r.id })),
        inventoryLogIds: logInsertResult.map((r) => String(r.id)),
        allocationResults,
      });

      return transformOrderAllocationResponse(rawResult);
    });
  } catch (error) {
    if (error instanceof AppError) throw error;

    throw AppError.serviceError(
      'Unable to confirm inventory allocation for this order.'
    );
  }
};

module.exports = {
  allocateInventoryForOrderService,
  reviewInventoryAllocationService,
  fetchPaginatedInventoryAllocationsService,
  confirmInventoryAllocationService,
};
