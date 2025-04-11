const {
  allocateInventoryForOrder,
} = require('../business/inventory-allocation-business');
const AppError = require('../utils/AppError');
const { withTransaction } = require('../database/db');
const { logError } = require('../utils/logger-helper');

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
 *
 * @param {Object} params
 * @param {string} params.orderId - Order ID
 * @param {Array<Object>} params.items - List of items to allocate
 * @param {string} params.userId - ID of the user performing the allocation
 * @param {'FIFO'|'FEFO'} [params.defaultStrategy='FEFO'] - Default strategy to use if not provided per item
 * @returns {Promise<Array>} List of successful allocation records
 */
const allocateMultipleInventoryItems = async ({
  orderId,
  items,
  userId,
  defaultStrategy = 'FEFO',
}) => {
  try {
    return await withTransaction(async (client) => {
      const allocations = [];

      for (const item of items) {
        const {
          warehouseId,
          productId,
          quantity,
          strategy = defaultStrategy,
        } = item;

        if (!warehouseId || !productId || !quantity) {
          throw AppError.validationError(
            'Each item must include warehouseId, productId, and quantity.'
          );
        }

        const allocation = await allocateInventory({
          orderId,
          warehouseId,
          productId,
          quantity,
          strategy,
          userId,
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
