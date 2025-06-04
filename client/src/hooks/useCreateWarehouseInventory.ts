import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  createWarehouseInventoryRecordsThunk,
  selectCreateWarehouseInventoryState,
} from '@features/warehouseInventory/state';
import type { CreateInventoryRecordsRequest } from '@features/inventoryShared/types/InventorySharedType.ts';
import { resetCreateInventoryState } from '@features/warehouseInventory/state/warehouseInventoryCreateSlice';

/**
 * Custom hook for interacting with the createWarehouseInventory state.
 *
 * Provides:
 * - Current loading, success, error, and response values from the slice.
 * - Action to trigger the inventory creation process.
 * - Method to reset the creation state (e.g., after form submission).
 */
const useCreateWarehouseInventory = () => {
  const dispatch = useAppDispatch();

  const { loading, error, success, response } = useAppSelector(
    selectCreateWarehouseInventoryState
  );

  const createInventory = useCallback(
    (payload: CreateInventoryRecordsRequest) => {
      dispatch(createWarehouseInventoryRecordsThunk(payload));
    },
    [dispatch]
  );

  const resetState = useCallback(() => {
    dispatch(resetCreateInventoryState());
  }, [dispatch]);

  return {
    loading,
    success,
    error,
    response,
    createInventory,
    resetState,
  };
};

export default useCreateWarehouseInventory;
