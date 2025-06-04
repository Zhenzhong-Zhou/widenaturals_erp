import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks.ts';
import {
  selectAvailableInventoryLots,
  selectAvailableInventoryLotsLoading,
  selectAvailableInventoryLotsError,
  selectTotalAvailableQuantity, fetchAvailableInventoryLotsThunk,
} from '@features/inventoryAllocation/state';
import type { FetchAvailableInventoryRequest } from '@features/inventoryAllocation';

/**
 * Custom hook to interact with available inventory lots state.
 * Manual fetching only — no automatic effect on mount.
 *
 */
const useAvailableInventoryLots = (requestParams: FetchAvailableInventoryRequest) => {
  const dispatch = useAppDispatch();
  
  const lots = useAppSelector(selectAvailableInventoryLots);
  const loading = useAppSelector(selectAvailableInventoryLotsLoading);
  const error = useAppSelector(selectAvailableInventoryLotsError);
  const totalAvailable = useAppSelector(selectTotalAvailableQuantity);
  
  /**
   * Manually fetch inventory lots using the provided or initial requestParams.
   */
  const fetchInventoryLots = useCallback(
    (params?: FetchAvailableInventoryRequest) => {
      const finalParams = params ?? requestParams;
      if (finalParams?.inventoryId) {
        dispatch(fetchAvailableInventoryLotsThunk(finalParams));
      }
    },
    [dispatch, requestParams]
  );
  
  return {
    lots,
    loading,
    error,
    totalAvailable,
    fetchInventoryLots,
  };
};

export default useAvailableInventoryLots;
