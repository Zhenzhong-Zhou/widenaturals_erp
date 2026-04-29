import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectWarehouseInventoryOutboundLoading,
  selectWarehouseInventoryOutboundError,
  selectWarehouseInventoryOutboundSuccess,
  selectWarehouseInventoryOutboundResponse,
  recordWarehouseInventoryOutboundThunk,
} from '@features/warehouseInventory/state';
import type { RecordWarehouseInventoryOutboundRequest } from '@features/warehouseInventory';
import { resetWarehouseInventoryOutbound } from '@features/warehouseInventory/state/warehouseInventoryOutboundSlice';

/**
 * Custom hook to access memoized warehouse inventory outbound recording state.
 * Automatically tracks loading, error, success, and outbound response.
 */
const useWarehouseInventoryOutbound = () => {
  const dispatch = useAppDispatch();
  
  const loading = useAppSelector(selectWarehouseInventoryOutboundLoading);
  const error = useAppSelector(selectWarehouseInventoryOutboundError);
  const success = useAppSelector(selectWarehouseInventoryOutboundSuccess);
  const outboundResponse = useAppSelector(selectWarehouseInventoryOutboundResponse);
  
  /**
   * Dispatches the thunk to record warehouse inventory outbound.
   * @param warehouseId - Target warehouse UUID.
   * @param payload - Bulk outbound records.
   */
  const recordOutbound = async (
    warehouseId: string,
    payload: RecordWarehouseInventoryOutboundRequest
  ) => {
    return dispatch(
      recordWarehouseInventoryOutboundThunk({ warehouseId, payload })
    );
  };
  
  /**
   * Resets the outbound recording state to initial.
   */
  const resetOutboundState = useCallback(() => {
    dispatch(resetWarehouseInventoryOutbound());
  }, [dispatch]);
  
  return {
    loading,
    error,
    success,
    outboundResponse,
    recordOutbound,
    resetOutboundState,
  };
};

export default useWarehouseInventoryOutbound;
