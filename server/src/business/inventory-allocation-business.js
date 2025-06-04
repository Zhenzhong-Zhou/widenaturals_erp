const {
  getOrderStatusAndItems,
  updateOrderAndItemStatus,
} = require('../repositories/order-repository');
const AppError = require('../utils/AppError');
const {
  insertInventoryAllocation,
  getAllocationsByOrderId,
  getTotalAllocatedForOrderItem,
} = require('../repositories/inventory-allocations-repository');
const { logError } = require('../utils/logger-helper');
const {
  transformOrderStatusAndItems,
  transformUpdatedOrderStatusResult,
} = require('../transformers/order-transformer');
const { getStatusValue, lockRow, retry } = require('../database/db');
const {
  determineOrderStatusFromAllocations,
} = require('../utils/allocation-utils');
const {
  updateWarehouseInventoryQuantity,
  fetchWarehouseInventoryQuantities,
} = require('../repositories/warehouse-inventory-repository');

/**
 * Allocates inventory for a confirmed order item using FIFO or FEFO or manually selected lots.
 * Supports automatic multi-lot allocation and manual lot selection with partial fill allowance.
 *
 * @param {Object} params - Allocation input values.
 * @param {string} params.inventoryId - Inventory ID for the item to allocate.
 * @param {number} params.quantity - Quantity to allocate.
 * @param {'FEFO' | 'FIFO'} [params.strategy='FEFO'] - Allocation strategy.
 * @param {string} params.orderId - ID of the order to allocate for.
 * @param {string} params.warehouseId - ID of the warehouse.
 * @param {Array<string>} [params.lotIds] - Optional list of lot IDs for manual override.
 * @param {boolean} [params.allowPartial=false] - Whether to allow partial allocation when lots are insufficient.
 * @param {string} params.userId - ID of the user performing the allocation.
 * @param {import('pg').PoolClient} [params.client] - Optional transaction client.
 * @returns {Promise<Object>} - Summary of allocation result.
 * @throws {AppError} - If the order is invalid or inventory is insufficient.
 */
const allocateInventoryForOrder = async ({
  inventoryId,
  quantity,
  strategy = 'FEFO',
  orderId,
  warehouseId,
  lotIds = [],
  allowPartial = false,
  userId,
  client,
}) => {
  try {
    // 0. Validate quantity
    if (typeof quantity !== 'number' || quantity <= 0) {
      throw AppError.validationError(
        'Quantity must be a positive number greater than zero.'
      );
    }

    // 1. Fetch and transform order status and items
    const rawOrderResult = await getOrderStatusAndItems(orderId, client);
    if (!rawOrderResult || rawOrderResult.length === 0) {
      throw AppError.notFoundError('Order not found or has no items.');
    }

    const { order_status_code, orderItems } =
      transformOrderStatusAndItems(rawOrderResult);

    // 2. Validate order-level status
    if (
      !order_status_code ||
      order_status_code.toUpperCase() !== 'ORDER_CONFIRMED'
    ) {
      throw AppError.validationError(
        `Order must be in 'confirmed' status before allocation. Current: ${order_status_code}`
      );
    }

    // 3. Match the inventory item in the order
    const orderItem = orderItems.find((item) => item.inventory_id === inventoryId);
    if (!orderItem) {
      throw AppError.validationError(
        `Inventory item ${inventoryId} is not part of the order.`
      );
    }

    // 4. Validate item-level status
    if (
      !orderItem.order_item_status_code ||
      orderItem.order_item_status_code.toUpperCase() !== 'ORDER_CONFIRMED'
    ) {
      throw AppError.validationError(
        `Order item for inventory ${inventoryId} is not confirmed. Current status: ${orderItem.order_item_status_code}`
      );
    }
    
    // 5. Validate quantity
    if (quantity > orderItem.quantity_ordered) {
      throw AppError.validationError(
        `Requested quantity (${quantity}) exceeds ordered quantity (${orderItem.quantity_ordered}) for inventory ${inventoryId}.`
      );
    }
    
    // 6. Find inventory lots (manual or automatic)
    const selectedLots = lotIds.length > 0
      ? await getSpecificLotsInOrder(lotIds, inventoryId, warehouseId, client)
      : await getAvailableLotsForAllocation(inventoryId, warehouseId, strategy, client);
    
    if (!selectedLots?.length) {
      throw AppError.notFoundError('No available lots found for allocation.');
    }
    
    let remaining = quantity;
    
    for (const rawLot of selectedLots) {
      const { warehouse_inventory_lot_id, inventory_id, item_name, lot_number, expiry_date } =
        transformWarehouseLotResult(rawLot);
      if (!warehouse_inventory_lot_id || !inventory_id) {
        throw AppError.notFoundError(
          `Unable to transform warehouse lot data for allocation.`
        );
      }
      
      await lockRow(
        client,
        'warehouse_inventory_lots',
        warehouse_inventory_lot_id
      );
      
      // 7. Check available quantity (lot-level and inventory-level)
      const key = `${warehouseId}-${inventory_id}`;
      const inventoryQtyMap = await fetchWarehouseInventoryQuantities(
        [{ warehouseId, inventoryId: inventory_id }],
        client
      );
      
      if (!inventoryQtyMap[key]) {
        throw AppError.notFoundError(`Warehouse inventory not found for ${key}`);
      }
      
      const lotAvailable = rawLot.quantity - (rawLot.reserved_quantity || 0);
      const invAvailable = inventoryQtyMap[key]?.available_quantity ?? 0;
      const availableQty = Math.min(lotAvailable, invAvailable);
      
      const toAllocate = Math.min(availableQty, remaining);
      if (toAllocate <= 0) continue;
      
      const alreadyAllocatedQty = await getTotalAllocatedForOrderItem({ orderId, inventoryId }, client);
      const afterThisAllocation = alreadyAllocatedQty + toAllocate;
      
      if (afterThisAllocation > orderItem.quantity_ordered) {
        throw AppError.validationError(`Allocating ${toAllocate} exceeds ordered quantity.`);
      }
      
      const totalAllocated = Number(afterThisAllocation);
      const orderedQty = Number(orderItem.quantity_ordered);
      const allocationStatus =
        totalAllocated >= orderedQty ? 'ALLOC_COMPLETED' : 'ALLOC_PARTIAL';
      const statusId = await getStatusValue({
        table: 'inventory_allocation_status',
        where: { code: allocationStatus },
        select: 'id',
      }, client);
      
      if (!statusId) {
        throw AppError.validationError(
          `Invalid allocation status code: ${allocationStatus}`
        );
      }
      
      // 8. Insert allocation and update inventory tracking
      await retry(() =>
        insertInventoryAllocation(
          {
            inventory_id,
            warehouse_id: warehouseId,
            lot_id: warehouse_inventory_lot_id,
            allocated_quantity: toAllocate,
            status_id: statusId,
            order_id: orderId,
            created_by: userId,
          },
          client
        )
      );
      
      await updateWarehouseInventoryLotQuantity(
        {
          lotId: warehouse_inventory_lot_id,
          reservedDelta: toAllocate, // only reserved is changed here
          userId,
        },
        client
      );
      
      const prevQty = inventoryQtyMap[key]?.available_quantity ?? 0;
      const newQty = prevQty - toAllocate;
      
      await bulkInsertInventoryActivityLogs(
        [
          {
            inventory_id,
            warehouse_id: warehouseId,
            lot_id: warehouse_inventory_lot_id,
            inventory_action_type_id: await getStatusValue(
              {
                table: 'inventory_action_types',
                where: { name: 'reserve' },
                select: 'id',
              },
              client
            ),
            previous_quantity: prevQty,
            quantity_change: -toAllocate, // reservation reduces available quantity
            new_quantity: newQty,
            status_id: await getStatusValue(
              {
                table: 'warehouse_lot_status',
                where: { name: 'reserved' }, // optional, if status changed
                select: 'id',
              },
              client
            ),
            adjustment_type_id: null, // optional for reservation
            order_id: orderId,
            user_id: userId,
            comments: `System auto-reserved ${toAllocate} units from lot "${lot_number}" (Item: ${item_name}, Expiry: ${expiry_date || 'N/A'})`,
          },
        ],
        client
      );
      
      const warehouseUpdates = {
        [key]: {
          reserved_quantity:
            (inventoryQtyMap[key]?.reserved_quantity ?? 0) + toAllocate,
          available_quantity: newQty,
        },
      };
      
      await updateWarehouseInventoryQuantity(client, warehouseUpdates, userId);
      
      remaining -= toAllocate;
      if (remaining <= 0) break;
    }
    
    if (remaining > 0 && lotIds.length > 0 && !allowPartial) {
      throw AppError.validationError(`Manual lots do not have enough stock. Remaining: ${remaining}`);
    }
    
    // 9. Final status update (order + item)
    const allAllocations = await getAllocationsByOrderId(orderId, client); // includes each allocation's status
    const newOrderStatus = determineOrderStatusFromAllocations(allAllocations);
    const totalAllocated = await getTotalAllocatedForOrderItem({ orderId, inventoryId }, client);
    const orderedQty = Number(orderItem.quantity_ordered);
    
    const itemStatus =
      totalAllocated >= orderedQty ? 'ALLOC_COMPLETED' : 'ALLOC_PARTIAL';
    
    const rawResult = await updateOrderAndItemStatus(
      {
        orderId,
        orderItemId: orderItem.order_item_id,
        orderStatusCode: newOrderStatus,
        itemStatusCode: itemStatus,
        userId,
      },
      client
    );
    
    return transformUpdatedOrderStatusResult(rawResult);
  } catch (error) {
    logError('Error allocating inventory:', error);
    throw AppError.businessError(
      'Inventory allocation failed: ' + error.message
    );
  }
};

module.exports = {
  allocateInventoryForOrder,
};
