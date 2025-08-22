const { withTransaction } = require('../database/db');
const { fetchOrderMetadata } = require('../repositories/order-repository');
const { validateStatusTransitionByCategory } = require('../business/order-business');
const { getOrderItemsByOrderId } = require('../repositories/order-item-repository');
const AppError = require('../utils/AppError');
const { extractOrderItemIdsByType, transformAllocationResultToInsertRows, transformAllocationReviewData } = require('../transformers/inventory-allocation-transformer');
const { getStatusId } = require('../config/status-cache');
const { getAllocatableBatchesByWarehouse } = require('../repositories/warehouse-inventory-repository');
const { allocateBatchesForOrderItems } = require('../business/inventory-allocation-business');
const { insertInventoryAllocationsBulk } = require('../repositories/inventory-allocations-repository');
const { logSystemException } = require('../utils/system-logger');

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
      
      validateStatusTransitionByCategory(
        orderCategory,
        currentStatusCategory,
        'processing',
        currentStatusCode,
        'ORDER_ALLOCATING'
      );
      
      // Get order items and ensure only items in allocatable status are processed
      const orderItemsMetadata = await getOrderItemsByOrderId(orderId, client);
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
const confirmInventoryAllocation = async (orderId) => {};

module.exports = {
  allocateInventoryForOrder,
};
