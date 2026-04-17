import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseInventoryUpdateStatusLoading,
  selectWarehouseInventoryUpdateStatusError,
  selectWarehouseInventoryUpdateStatusSuccess,
  selectWarehouseInventoryUpdateStatusResponse,
  updateWarehouseInventoryStatusesThunk,
} from '@features/warehouseInventory/state';
import type { UpdateWarehouseInventoryStatusRequest } from '@features/warehouseInventory';
import {
  resetWarehouseInventoryUpdateStatus
} from '@features/warehouseInventory/state/warehouseInventoryUpdateStatusSlice';

/**
 * Custom hook to access memoized warehouse inventory status update state.
 * Automatically tracks loading, error, success, and update response.
 */
const useWarehouseInventoryUpdateStatus = () => {
  const dispatch = useAppDispatch();
  
  const loading = useAppSelector(selectWarehouseInventoryUpdateStatusLoading);
  const error = useAppSelector(selectWarehouseInventoryUpdateStatusError);
  const success = useAppSelector(selectWarehouseInventoryUpdateStatusSuccess);
  const updateResponse = useAppSelector(selectWarehouseInventoryUpdateStatusResponse);
  
  /**
   * Dispatches the thunk to update warehouse inventory statuses.
   * @param warehouseId - Target warehouse UUID.
   * @param payload - Bulk status updates.
   */
  const updateStatuses = async (
    warehouseId: string,
    payload: UpdateWarehouseInventoryStatusRequest
  ) => {
    return dispatch(updateWarehouseInventoryStatusesThunk({ warehouseId, payload }));
  };
  
  /**
   * Resets the status update state to initial.
   */
  const resetUpdateStatusState = useCallback(() => {
    dispatch(resetWarehouseInventoryUpdateStatus());
  }, [dispatch]);
  
  return {
    loading,
    error,
    success,
    updateResponse,
    updateStatuses,
    resetUpdateStatusState,
  };
};

export default useWarehouseInventoryUpdateStatus;
