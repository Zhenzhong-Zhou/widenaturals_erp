import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  createWarehouseInventoryRecordsThunk,
  selectCreatedWarehouseRecords,
} from '@features/warehouseInventory/state';
import { resetCreateInventoryState } from '@features/warehouseInventory/state/warehouseInventoryCreateSlice';
import type { CreateInventoryRecordsRequest } from '@features/inventoryShared/types/InventorySharedType';

/**
 * Custom hook for interacting with the createWarehouseInventory state.
 *
 * This hook:
 * - Retrieves normalized inventory response (warehouse/location), loading, success, error, and message
 * - Provides a dispatch method to trigger creation
 * - Provides a reset method to clear the state after usage
 */
const useCreateWarehouseInventory = () => {
  const dispatch = useAppDispatch();

  const { warehouse, location, loading, error, success, message } =
    useAppSelector(selectCreatedWarehouseRecords);

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
    warehouse,
    location,
    loading,
    error,
    success,
    message,
    createInventory,
    resetState,
  };
};

export default useCreateWarehouseInventory;
