const { allocateInventoryForOrder } = require('../business/inventory-allocation-business-logic');
const AppError = require('../utils/AppError');

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
 * @returns {Promise<Object>} - The created inventory allocation record.
 */
const allocateInventory = async (params) => {
  // You could add audit logging, permission checks, or pre-validation here if needed.
  return await allocateInventoryForOrder(params);
};

/**
 * Service to handle multiple inventory allocations for a single order.
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
  const allocations = [];
  
  for (const item of items) {
    const {
      warehouseId,
      productId,
      quantity,
      strategy = defaultStrategy,
    } = item;
    
    if (!warehouseId || !productId || !quantity) {
      throw AppError.validationError('Each item must include warehouseId, productId, and quantity.');
    }
    
    const allocation = await allocateInventory({
      orderId,
      warehouseId,
      productId,
      quantity,
      strategy,
      userId,
    });
    
    allocations.push(allocation);
  }
  
  return allocations;
};

module.exports = {
  allocateInventory,
  allocateMultipleInventoryItems
};
