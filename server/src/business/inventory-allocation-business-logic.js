const { getOrderStatusAndItems } = require('../repositories/order-repository');
const AppError = require('../utils/AppError');
const { getAvailableLotForAllocation } = require('../repositories/warehouse-inventory-lot-repository');
const { insertInventoryAllocation } = require('../repositories/inventory-allocations-repository');
const { logError } = require('../utils/logger-helper');
const { transformOrderStatusAndItems } = require('../transformers/order-transformer');
const { transformWarehouseLotResult } = require('../transformers/warehouse-inventory-lot-transformer');

/**
 * Allocates inventory for a confirmed order based on FIFO or FEFO strategy.
 *
 * @param {Object} params - Allocation input values.
 * @param {string} params.productId - ID of the product to allocate.
 * @param {number} params.quantity - Quantity to allocate.
 * @param {'FEFO' | 'FIFO'} [params.strategy='FEFO'] - Allocation strategy.
 * @param {string} params.orderId - ID of the order to allocate for.
 * @param {string} params.warehouseId - ID of the warehouse.
 * @param {string} params.userId - ID of the user performing the allocation.
 * @returns {Promise<Object>} - The inserted allocation record.
 * @throws {AppError} - If the order is invalid or inventory is insufficient.
 */
const allocateInventoryForOrder = async ({
                                                  productId,
                                                  quantity,
                                                  strategy = 'FEFO',
                                                  orderId,
                                                  warehouseId,
                                                  userId,
                                                }) => {
  try {
    // 1. Fetch and transform order status and items
    const rawOrderResult = await getOrderStatusAndItems(orderId);
    if (!rawOrderResult || rawOrderResult.length === 0) {
      throw AppError.notFoundError('Order not found or has no items.');
    }
    
    const {
      order_status_id,
      order_status_name,
      items,
    } = transformOrderStatusAndItems(rawOrderResult);
    
    if (!order_status_name || order_status_name.toLowerCase() !== 'confirmed') {
      throw AppError.validationError(
        `Order must be in 'confirmed' status before allocation. Current: ${order_status_name}`
      );
    }
    
    if (!items || items.length === 0) {
      throw AppError.notFoundError('Order has no items.');
    }
    
    // 2. Match the product in the order
    const matchingItem = items.find((item) => item.product_id === productId);
    if (!matchingItem) {
      throw AppError.validationError('This product is not part of the order.');
    }
    
    if (quantity > matchingItem.quantity_ordered) {
      throw AppError.validationError(
        `Requested quantity (${quantity}) exceeds ordered quantity (${matchingItem.quantity_ordered}).`
      );
    }
    
    // 3. Find best lot to allocate
    const rawInventoryResult = await getAvailableLotForAllocation(productId, warehouseId, quantity, strategy);
    const { warehouse_inventory_lot_id, inventory_id } = transformWarehouseLotResult(rawInventoryResult);
    if (!warehouse_inventory_lot_id) {
      throw AppError.notFoundError('No available inventory to fulfill this order.');
    }
    
    // 4. Create inventory allocation
    return await insertInventoryAllocation({
      inventory_id: inventory_id,
      warehouse_id: warehouseId,
      lot_id: warehouse_inventory_lot_id,
      allocated_quantity: quantity,
      status_id: order_status_id,
      order_id: orderId,
      created_by: userId,
      updated_by: userId,
    });
  } catch (error) {
    logError('Error allocating inventory:', error);
    throw AppError.businessError('Inventory allocation failed: ' + error.message);
  }
};

module.exports = {
  allocateInventoryForOrder,
};
