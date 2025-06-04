import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectAdjustedInventoryRecords
} from '@features/warehouseInventory/state/warehouseInventoryAdjustSelectors';
import type { AdjustInventoryRequestBody } from '@features/inventoryShared/types/InventorySharedType';
import { adjustWarehouseInventoryQuantitiesThunk } from '@features/warehouseInventory/state';
import { resetAdjustInventoryState } from '@features/warehouseInventory/state/warehouseInventoryAdjustSlice';

/**
 * Custom hook for managing adjusted warehouse inventory.
 *
 * Provides:
 * - Selector values for adjusted warehouse/location records, message, success, loading, and error
 * - Function to dispatch adjustment request
 * - Function to reset state
 */
const useAdjustWarehouseInventory = () => {
  const dispatch = useAppDispatch();
  
  const {
    warehouse,
    location,
    message,
    success,
    loading,
    error,
  } = useAppSelector(selectAdjustedInventoryRecords);
  
  const adjustInventory = useCallback(
    (payload: AdjustInventoryRequestBody) => {
      dispatch(adjustWarehouseInventoryQuantitiesThunk(payload));
    },
    [dispatch]
  );
  
  const resetState = useCallback(() => {
    dispatch(resetAdjustInventoryState());
  }, [dispatch]);
  
  return {
    warehouse,
    location,
    message,
    success,
    loading,
    error,
    adjustInventory,
    resetState,
  };
};

export default useAdjustWarehouseInventory;
