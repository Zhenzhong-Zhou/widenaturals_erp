import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseInventoryAdjustQuantityLoading,
  selectWarehouseInventoryAdjustQuantityError,
  selectWarehouseInventoryAdjustQuantityResponse,
  adjustWarehouseInventoryQuantitiesThunk, selectWarehouseInventoryAdjustQuantitySuccess,
} from '@features/warehouseInventory/state';
import type { AdjustWarehouseInventoryQuantityRequest } from '@features/warehouseInventory';
import {
  resetWarehouseInventoryAdjustQuantity
} from '@features/warehouseInventory/state/warehouseInventoryAdjustQuantitySlice';

/**
 * Custom hook to access memoized warehouse inventory quantity adjustment state.
 * Automatically tracks loading, error, and adjustment response.
 */
const useWarehouseInventoryAdjustQuantity = () => {
  const dispatch = useAppDispatch();
  
  const loading = useAppSelector(selectWarehouseInventoryAdjustQuantityLoading);
  const error = useAppSelector(selectWarehouseInventoryAdjustQuantityError);
  const isSuccess = useAppSelector(selectWarehouseInventoryAdjustQuantitySuccess);
  const adjustResponse = useAppSelector(selectWarehouseInventoryAdjustQuantityResponse);
  
  /**
   * Dispatches the thunk to adjust warehouse inventory quantities.
   * @param warehouseId - Target warehouse UUID.
   * @param payload - Bulk quantity adjustments.
   */
  const adjustQuantities = async (
    warehouseId: string,
    payload: AdjustWarehouseInventoryQuantityRequest
  ) => {
    return dispatch(adjustWarehouseInventoryQuantitiesThunk({ warehouseId, payload }));
  };
  
  /**
   * Resets the quantity adjustment state to initial.
   */
  const resetAdjustQuantityState = useCallback(() => {
    dispatch(resetWarehouseInventoryAdjustQuantity());
  }, [dispatch]);
  
  return {
    loading,
    error,
    isSuccess,
    adjustResponse,
    adjustQuantities,
    resetAdjustQuantityState,
  };
};

export default useWarehouseInventoryAdjustQuantity;
