const { getOrderStatusAndItems, updateOrderAndItemStatus } = require('../repositories/order-repository');
const AppError = require('../utils/AppError');
const { getAvailableLotForAllocation, updateWarehouseInventoryLotQuantity } = require('../repositories/warehouse-inventory-lot-repository');
const { insertInventoryAllocation, getAllocationsByOrderId, getTotalAllocatedForOrderItem } = require('../repositories/inventory-allocations-repository');
const { logError } = require('../utils/logger-helper');
const { transformOrderStatusAndItems, transformUpdatedOrderStatusResult } = require('../transformers/order-transformer');
const { transformWarehouseLotResult } = require('../transformers/warehouse-inventory-lot-transformer');
const { getStatusValue, lockRow, retry } = require('../database/db');
const { determineOrderStatusFromAllocations } = require('../utils/allocation-utils');
const { updateWarehouseInventoryQuantity, fetchWarehouseInventoryQuantities } = require('../repositories/warehouse-inventory-repository');

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
      order_status_code,
      orderItems,
    } = transformOrderStatusAndItems(rawOrderResult);
    
    // 2. Validate order-level status
    if (!order_status_code || order_status_code.toUpperCase() !== 'ORDER_CONFIRMED') {
      throw AppError.validationError(
        `Order must be in 'confirmed' status before allocation. Current: ${order_status_code}`
      );
    }
    
    // 3. Match the product in the order
    const orderItem = orderItems.find((item) => item.product_id === productId);
    if (!orderItem) {
      throw AppError.validationError(`Product ${productId} is not part of the order.`);
    }
    
    // 4. Validate item-level status
    if (
      !orderItem.order_item_status_code ||
      orderItem.order_item_status_code.toUpperCase() !== 'ORDER_CONFIRMED'
    ) {
      throw AppError.validationError(
        `Order item for product ${productId} is not confirmed. Current status: ${orderItem.order_item_status_code}`
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
    if (!rawLot) {
      throw AppError.notFoundError(`No available inventory lot for product ${productId} in warehouse ${warehouseId}.`);
    }
    
    const { warehouse_inventory_lot_id, inventory_id } = transformWarehouseLotResult(rawLot);
    if (!warehouse_inventory_lot_id || !inventory_id) {
      throw AppError.notFoundError(`Unable to transform warehouse lot data for allocation.`);
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
    
    // 7.1 Prevent over-reservation by validating against available stock
    const key = `${warehouseId}-${inventory_id}`;
    const inventoryQtyMap = await fetchWarehouseInventoryQuantities([
      { warehouseId, inventoryId: inventory_id }
    ], client);
    
    if (!inventoryQtyMap[key]) {
      throw AppError.notFoundError(`Warehouse inventory not found for ${key}`);
    }
    
    const prevAvailable = inventoryQtyMap[key].available_quantity ?? 0;
    
    if (quantity > prevAvailable) {
      throw AppError.validationError(
        `Cannot reserve ${quantity} units for ${productId}. Only ${prevAvailable} available in warehouse ${warehouseId}.`
      );
    }

    // 7.2 Prevent over-reservation against ordered quantity
    const alreadyAllocatedQty = await getTotalAllocatedForOrderItem({ orderId, productId }, client);
    
    if (alreadyAllocatedQty + quantity > orderItem.quantity_ordered) {
      throw AppError.validationError(
        `Cannot allocate ${quantity} more units for product ${productId}. Already allocated: ${alreadyAllocatedQty}, ordered: ${orderItem.quantity_ordered}.`
      );
    }
    
    // 8. Insert allocation record into inventory_allocations table
    await retry(() =>
      insertInventoryAllocation({
        inventory_id,
        warehouse_id: warehouseId,
        lot_id: warehouse_inventory_lot_id,
        allocated_quantity: quantity,
        status_id,
        order_id: orderId,
        created_by: userId,
      }, client)
    );
    
    // 8.1 Update reserved_quantity on the warehouse_inventory_lots table
    await updateWarehouseInventoryLotQuantity(
      {
        lotId: warehouse_inventory_lot_id,
        reservedDelta: quantity, // only reserved is changed here
        userId,
      },
      client
    );
    
    // 8.2 Update available_quantity and reserved_quantity in warehouse_inventory (warehouse-level summary)
    if (!inventoryQtyMap[key]) {
      throw AppError.notFoundError(`Warehouse inventory not found for ${key}`);
    }
    
    const newAvailable = prevAvailable - quantity;
    
    if (newAvailable < 0) {
      throw AppError.validationError(
        `Insufficient stock. Cannot allocate ${quantity} from available: ${prevAvailable}`
      );
    }
    
    const warehouseUpdates = {
      [key]: {
        reserved_quantity: (inventoryQtyMap[key].reserved_quantity ?? 0) + quantity,
        available_quantity: newAvailable,
      }
    };
    
    await updateWarehouseInventoryQuantity(client, warehouseUpdates, userId);
    
    // 9. Fetch all allocations for this order to determine overall order allocation status
    const allAllocations = await getAllocationsByOrderId(orderId, client); // includes each allocation's status

    // 10. Determine new order status based on allocation statuses (e.g. ORDER_ALLOCATED or ORDER_ALLOCATING)
    const newOrderStatus = determineOrderStatusFromAllocations(allAllocations);

    // 11. Determine item-level status based on how much was allocated
    const itemStatus = quantity < orderItem.quantity_ordered ? 'ALLOC_PARTIAL' : 'ALLOC_COMPLETED';
    
    // 12. Update both order status and this specific item's status in the DB
    const rawResult = await updateOrderAndItemStatus({
      orderId,
      orderItemId: orderItem.order_item_id,
      orderStatusCode: newOrderStatus,
      itemStatusCode: itemStatus,
      userId,
    }, client);

    // 13. Transform update result into a structured summary object
    return transformUpdatedOrderStatusResult(rawResult);
  } catch (error) {
    logError('Error allocating inventory:', error);
    throw AppError.businessError('Inventory allocation failed: ' + error.message);
  }
};

module.exports = {
  allocateInventoryForOrder,
};
