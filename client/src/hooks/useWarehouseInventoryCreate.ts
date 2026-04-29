import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseInventoryCreateError,
  selectWarehouseInventoryCreateLoading,
  selectWarehouseInventoryCreateResponse,
  selectCreatedInventoryCount,
  selectCreatedInventoryIds,
  createWarehouseInventoryThunk,
} from '@features/warehouseInventory/state';
import type { CreateWarehouseInventoryRequest } from '@features/warehouseInventory';
import { resetWarehouseInventoryCreate } from '@features/warehouseInventory/state/warehouseInventoryCreateSlice';

/**
 * Custom hook to access memoized warehouse inventory creation state.
 * Automatically tracks loading, error, created records, and their labels.
 */
const useWarehouseInventoryCreate = () => {
  const dispatch = useAppDispatch();
  
  const loading = useAppSelector(selectWarehouseInventoryCreateLoading);
  const error = useAppSelector(selectWarehouseInventoryCreateError);
  const createResponse = useAppSelector(selectWarehouseInventoryCreateResponse);
  const createdCount = useAppSelector(selectCreatedInventoryCount);
  const createdIds = useAppSelector(selectCreatedInventoryIds);
  
  /**
   * Dispatches the thunk to create warehouse inventory records.
   * @param warehouseId - Target warehouse UUID.
   * @param payload - Bulk inventory records to create.
   */
  const createWarehouseInventory = async (
    warehouseId: string,
    payload: CreateWarehouseInventoryRequest
  ) => {
    return dispatch(createWarehouseInventoryThunk({ warehouseId, payload }));
  };
  
  /**
   * Resets the warehouse inventory creation state to initial.
   */
  const resetCreateState = useCallback(() => {
    dispatch(resetWarehouseInventoryCreate());
  }, [dispatch]);
  
  return {
    loading,
    error,
    createResponse,
    createdCount,
    createdIds,
    createWarehouseInventory,
    resetCreateState,
  };
};

export default useWarehouseInventoryCreate;
