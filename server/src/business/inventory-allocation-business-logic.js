const { getOrderStatusAndItems } = require('../repositories/order-repository');
const AppError = require('../utils/AppError');
const { getAvailableLotForAllocation } = require('../repositories/warehouse-inventory-lot-repository');
const { insertInventoryAllocation } = require('../repositories/inventory-allocations-repository');
const { logError } = require('../utils/logger-helper');
const { transformOrderStatusAndItems } = require('../transformers/order-transformer');
const { transformWarehouseLotResult } = require('../transformers/warehouse-inventory-lot-transformer');
const { getStatusValue, lockRow, retry } = require('../database/db');

/**
 * Allocates inventory for a confirmed order item using FIFO or FEFO.
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
                                           client
                                         }) => {
  try {
    // 0. Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      throw AppError.validationError('Quantity must be a positive number greater than zero.');
    }
    
    // 1. Fetch and transform order status and items
    const rawOrderResult = await getOrderStatusAndItems(orderId, client);
    if (!rawOrderResult || rawOrderResult.length === 0) {
      throw AppError.notFoundError('Order not found or has no items.');
    }
    
    const {
      order_status_name,
      orderItems,
    } = transformOrderStatusAndItems(rawOrderResult);
    
    // 2. Validate order-level status
    if (!order_status_name || order_status_name.toLowerCase() !== 'confirmed') {
      throw AppError.validationError(
        `Order must be in 'confirmed' status before allocation. Current: ${order_status_name}`
      );
    }
    
    // 3. Match the product in the order
    const orderItem = orderItems.find((item) => item.product_id === productId);
    if (!orderItem) {
      throw AppError.validationError(`Product ${productId} is not part of the order.`);
    }
    
    // 4. Validate item-level status
    if (
      !orderItem.order_item_status_name ||
      orderItem.order_item_status_name.toLowerCase() !== 'confirmed'
    ) {
      throw AppError.validationError(
        `Order item for product ${productId} is not confirmed. Current status: ${orderItem.order_item_status_name}`
      );
    }
    
    // 5. Validate quantity
    if (quantity > orderItem.quantity_ordered) {
      throw AppError.validationError(
        `Requested quantity (${quantity}) exceeds ordered quantity (${orderItem.quantity_ordered}) for product ${productId}.`
      );
    }
    
    // 6. Find inventory lot using FIFO/FEFO
    const rawLot = await getAvailableLotForAllocation(productId, warehouseId, quantity, strategy, client);
    const { warehouse_inventory_lot_id, inventory_id } = transformWarehouseLotResult(rawLot);
    
    if (!warehouse_inventory_lot_id) {
      throw AppError.notFoundError(`No available inventory for product ${productId} in warehouse ${warehouseId}.`);
    }
    
    await lockRow(client, 'warehouse_inventory_lots', warehouse_inventory_lot_id);
    
    // 7. Determine allocation status
    const statusCode =
      quantity < orderItem.quantity_ordered ? 'ALLOC_PARTIAL' : 'ALLOC_COMPLETED';
    
    const status_id = await getStatusValue({
      table: 'inventory_allocation_status',
      where: { code: statusCode },
      select: 'id',
    }, client);
    
    if (!status_id) {
      throw AppError.validationError(`Invalid allocation status code: ${statusCode}`);
    }
    
    // 8. Insert allocation
    return await retry(() =>
      insertInventoryAllocation({
        inventory_id,
        warehouse_id: warehouseId,
        lot_id: warehouse_inventory_lot_id,
        allocated_quantity: quantity,
        status_id,
        order_id: orderId,
        created_by: userId,
        updated_by: userId,
      }, client)
    );
  } catch (error) {
    logError('Error allocating inventory:', error);
    throw AppError.businessError('Inventory allocation failed: ' + error.message);
  }
};

module.exports = {
  allocateInventoryForOrder,
};
