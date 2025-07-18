import { useAppSelector } from '@store/storeHooks.ts';
import {
  selectInventoryAllocationData,
  selectInventoryAllocationError,
  selectInventoryAllocationSuccess,
  selectIsAllocatingInventory,
  selectTotalAllocatedItems,
  selectTotalAllocatedOrders,
} from '@features/inventoryAllocation';

/**
 * Hook to handle posting inventory allocation and accessing its state.
 */
const useAllocateInventory = () => {
  const isLoading = useAppSelector(selectIsAllocatingInventory);
  const isSuccess = useAppSelector(selectInventoryAllocationSuccess);
  const error = useAppSelector(selectInventoryAllocationError);
  const data = useAppSelector(selectInventoryAllocationData);
  const totalItems = useAppSelector(selectTotalAllocatedItems);
  const totalOrders = useAppSelector(selectTotalAllocatedOrders);

  return {
    isLoading,
    isSuccess,
    error,
    data,
    totalItems,
    totalOrders,
  };
};

export default useAllocateInventory;
