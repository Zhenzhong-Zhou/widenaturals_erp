export const allocateInventoryForOrder = async ({
                                                  productId,
                                                  quantity,
                                                  strategy = 'FEFO',
                                                  orderId,
                                                  warehouseId,
                                                  userId
                                                }: {
  productId: string;
  quantity: number;
  strategy?: 'FEFO' | 'FIFO';
  orderId: string;
  warehouseId: string;
  userId: string;
}) => {
  // 1. Find inventory to allocate
  const inventory = await getAvailableInventoryForAllocation(productId, quantity, strategy);
  
  if (!inventory) {
    throw new Error('No available inventory to fulfill this order.');
  }
  
  // 2. Insert allocation
  const allocation = await insertInventoryAllocation({
    inventory_id: inventory.id,
    warehouse_id: warehouseId,
    lot_id: inventory.lot_id || null,
    allocated_quantity: quantity,
    status_id: 'pending', // or whatever your status ID is
    order_id: orderId,
    created_by: userId,
    updated_by: userId,
  });
  
  return allocation;
};
