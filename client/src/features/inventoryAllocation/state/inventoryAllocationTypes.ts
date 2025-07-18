export interface InventoryLotParams {
  inventoryId: string;
}

export interface InventoryLotQuery {
  warehouseId?: string;
  strategy?: 'FIFO' | 'LIFO' | 'FEFO' | string; // optional and extendable
}

export type FetchAvailableInventoryRequest = InventoryLotParams &
  InventoryLotQuery;

export interface AvailableInventoryLot {
  lotId: string;
  lotNumber: string;
  inboundDate: string; // ISO string format
  manufactureDate: string | null;
  expiryDate: string;
  lotQuantity: number;
  reservedQuantity: number;
  availableQuantity: number;
  inventoryId: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  status: 'in_stock' | 'out_of_stock' | 'reserved' | string; // extend as needed
  isNearExpiry: boolean;
}

export interface AvailableInventoryLotsResponse {
  success: boolean;
  message: string;
  data: AvailableInventoryLot[];
}

export type AllocationStrategy = 'FEFO' | 'FIFO' | 'LIFO' | 'CUSTOM';

export interface AllocationItem {
  warehouseId: string;
  inventoryId: string;
  quantity: number;

  // For custom manual allocation
  lotIds?: string[]; // optional: only needed for manual strategy
  allowPartial?: boolean; // optional: only used when lotIds are provided

  // Optional override of defaultStrategy for this item
  strategy?: AllocationStrategy;
}

export interface InventoryAllocationPayload {
  orderId: string;
  defaultStrategy?: AllocationStrategy;
  items: AllocationItem[];
}

export interface AllocationResult {
  orderId: string;
  updatedOrderCount: number;
  updatedItemCount: number;
}

export interface InventoryAllocationResponse {
  success: boolean;
  message: string;
  allocations: AllocationResult[];
}
