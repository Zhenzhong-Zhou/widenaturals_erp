const {
  allocateInventoryForOrder,
} = require('../business/inventory-allocation-business');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../database/db');
const { logError, logInfo } = require('../utils/logger-helper');

/**
 * Service wrapper for inventory allocation.
 *
 * @param {Object} params - The allocation input.
 * @param {string} params.productId - Product ID to allocate.
 * @param {number} params.quantity - Quantity to allocate.
 * @param {'FIFO'|'FEFO'} [params.strategy] - Allocation strategy (defaults to FEFO).
 * @param {string} params.orderId - Order ID.
 * @param {string} params.warehouseId - Warehouse ID.
 * @param {string} params.userId - The user who initiated the allocation.
 * @param {Object} [params.client] - Optional database client for transaction.
 * @returns {Promise<Object>} - The created inventory allocation record.
 */
const allocateInventory = async (params) => {
  // You could add audit logging, permission checks, or pre-validation here if needed.
  return await allocateInventoryForOrder(params);
};

/**
 * Service to handle multiple inventory allocations for a single order in a single transaction.
 * Supports a global allocation strategy (FIFO/FEFO), with optional per-item overrides.
 *
 * @param {Object} params
 * @param {string} params.orderId - Order ID.
 * @param {Array<Object>} params.items - List of items to allocate. Each item may override the global strategy.
 * @param {string} params.userId - ID of the user performing the allocation.
 * @param {'FIFO'|'FEFO'} [params.strategy='FEFO'] - Global default allocation strategy. Individual items can override with their own `strategy` value.
 * @returns {Promise<Array>} List of allocation results, one per item.
 */
const allocateMultipleInventoryItems = async ({
  orderId,
  items,
  userId,
  strategy: defaultStrategy = 'FEFO',
}) => {
  try {
    return await withTransaction(async (client) => {
      const allocations = [];

      for (const item of items) {
        const { warehouseId, inventoryId, quantity, strategy } = item;

        if (!warehouseId || !inventoryId || !quantity) {
          throw AppError.validationError(
            'Each item must include warehouseId, inventoryId, and quantity.'
          );
        }

        // Log only when allowPartial is inferred due to lotIds
        if (item.lotIds?.length && item.allowPartial === undefined) {
          logInfo(
            `Manual lotIds passed for inventory ${inventoryId}, but allowPartial flag is missing. This may cause allocation to fail if lots are insufficient.`
          );
        }

        const allocation = await allocateInventory({
          orderId,
          warehouseId,
          inventoryId,
          quantity,
          strategy: strategy || defaultStrategy,
          userId,
          lotIds: item.lotIds || [],
          allowPartial: item.allowPartial ?? item.lotIds?.length > 0,
          client, // Pass client if supported in business logic
        });

        allocations.push(allocation);
      }

      return allocations;
    });
  } catch (error) {
    logError('Error during multiple inventory allocations:', error);
    throw AppError.serviceError(
      'Failed to allocate all inventory items: ' + error.message
    );
  }
};

module.exports = {
  allocateInventory,
  allocateMultipleInventoryItems,
};
