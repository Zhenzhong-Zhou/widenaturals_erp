import availableInventoryLotsReducer from '@features/inventoryAllocation/state/availableInventoryLotsSlice';
import allocateInventoryReducer from '@features/inventoryAllocation/state/allocateInventorySlice.ts';

export const inventoryAllocationReducers = {
  availableInventoryLots: availableInventoryLotsReducer,
  allocateInventory: allocateInventoryReducer,
};

export type {
  InventoryLotParams,
  InventoryLotQuery,
  AvailableInventoryLot,
  FetchAvailableInventoryRequest,
  AvailableInventoryLotsResponse,
  AllocationStrategy,
  AllocationItem,
  InventoryAllocationPayload,
  AllocationResult,
  InventoryAllocationResponse,
} from './inventoryAllocationTypes';
export {
  fetchAvailableInventoryLotsThunk,
  postInventoryAllocationThunk,
} from './inventoryAllocationThunks';
export {
  selectAvailableInventoryLots,
  selectAvailableInventoryLotsLoading,
  selectAvailableInventoryLotsError,
  selectTotalAvailableQuantity,
} from './availableInventoryLotsSelectors';
export {
  selectIsAllocatingInventory,
  selectInventoryAllocationSuccess,
  selectInventoryAllocationError,
  selectInventoryAllocationData,
  selectTotalAllocatedItems,
  selectTotalAllocatedOrders,
} from './allocateInventorySelectors';
