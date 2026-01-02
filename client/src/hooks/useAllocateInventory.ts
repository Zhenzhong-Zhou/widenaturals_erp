import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectAllocationData,
  selectAllocationLoading,
  selectAllocationError,
  selectAllocationOrderId,
  selectAllocatedIds,
  allocateInventoryThunk,
} from '@features/inventoryAllocation/state';
import type {
  AllocateInventoryBody,
  AllocateInventoryParams,
} from '@features/inventoryAllocation/state';
import { resetAllocateInventory } from '@features/inventoryAllocation/state/allocateInventorySlice';

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
    dispatch(resetAllocateInventory());
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
