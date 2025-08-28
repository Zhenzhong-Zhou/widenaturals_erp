import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import { allocateInventoryThunk } from '@features/inventoryAllocation/state/inventoryAllocationThunks';
import {
  selectAllocationData,
  selectAllocationLoading,
  selectAllocationError,
  selectAllocationOrderId,
  selectAllocatedIds,
} from '@features/inventoryAllocation/state/allocateInventorySelectors';
import { resetAllocationState } from '@features/inventoryAllocation/state/allocateInventorySlice';
import type {
  AllocateInventoryBody,
  AllocateInventoryParams
} from '@features/inventoryAllocation/state';

/**
 * Custom hook for inventory allocation state and actions.
 *
 * Provides derived state and dispatchable actions for triggering allocation
 * or resetting the state.
 */
const useAllocateInventory = () => {
  const dispatch = useAppDispatch();
  
  const data = useAppSelector(selectAllocationData);
  const loading = useAppSelector(selectAllocationLoading);
  const error = useAppSelector(selectAllocationError);
  const orderId = useAppSelector(selectAllocationOrderId);
  const allocationIds = useAppSelector(selectAllocatedIds);
  
  /**
   * Trigger inventory allocation for a given order.
   */
  const allocate = useCallback(
    (params: AllocateInventoryParams, body: AllocateInventoryBody) => {
      return dispatch(allocateInventoryThunk({ params, body }));
    },
    [dispatch]
  );
  
  /**
   * Reset allocation state to initial.
   */
  const reset = useCallback(() => {
    dispatch(resetAllocationState());
  }, [dispatch]);
  
  /**
   * Memoized state bundle.
   */
  const state = useMemo(
    () => ({
      data,
      loading,
      error,
      orderId,
      allocationIds,
    }),
    [data, loading, error, orderId, allocationIds]
  );
  
  return { ...state, allocate, reset };
};

export default useAllocateInventory;
