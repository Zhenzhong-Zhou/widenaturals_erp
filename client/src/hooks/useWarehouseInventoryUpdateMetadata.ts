import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseInventoryUpdateMetadataLoading,
  selectWarehouseInventoryUpdateMetadataError,
  selectWarehouseInventoryUpdateMetadataSuccess,
  selectWarehouseInventoryUpdateMetadataResponse,
  updateWarehouseInventoryMetadataThunk,
} from '@features/warehouseInventory/state';
import type { UpdateWarehouseInventoryMetadataRequest } from '@features/warehouseInventory';
import {
  resetWarehouseInventoryUpdateMetadata
} from '@features/warehouseInventory/state/warehouseInventoryUpdateMetadataSlice';

/**
 * Custom hook to access memoized warehouse inventory metadata update state.
 * Automatically tracks loading, error, success, and update response.
 */
const useWarehouseInventoryUpdateMetadata = () => {
  const dispatch = useAppDispatch();
  
  const loading = useAppSelector(selectWarehouseInventoryUpdateMetadataLoading);
  const error = useAppSelector(selectWarehouseInventoryUpdateMetadataError);
  const success = useAppSelector(selectWarehouseInventoryUpdateMetadataSuccess);
  const updateResponse = useAppSelector(selectWarehouseInventoryUpdateMetadataResponse);
  
  /**
   * Dispatches the thunk to update a single inventory record's metadata.
   * @param warehouseId - Target warehouse UUID.
   * @param inventoryId - Target inventory record UUID.
   * @param payload - Metadata fields to update.
   */
  const updateMetadata = async (
    warehouseId: string,
    inventoryId: string,
    payload: UpdateWarehouseInventoryMetadataRequest
  ) => {
    return dispatch(
      updateWarehouseInventoryMetadataThunk({ warehouseId, inventoryId, payload })
    );
  };
  
  /**
   * Resets the metadata update state to initial.
   */
  const resetUpdateMetadataState = useCallback(() => {
    dispatch(resetWarehouseInventoryUpdateMetadata());
  }, [dispatch]);
  
  return {
    loading,
    error,
    success,
    updateResponse,
    updateMetadata,
    resetUpdateMetadataState,
  };
};

export default useWarehouseInventoryUpdateMetadata;
