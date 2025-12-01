import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectSkuStatusData,
  selectSkuStatusLoading,
  selectSkuStatusError,
  selectSkuStatusSuccess,
  selectUpdatedSkuId,
} from '@features/sku/state/skuStatusSelectors';
import { updateSkuStatusThunk } from '@features/sku/state/skuThunks';
import { resetSkuStatus } from '@features/sku/state/skuStatusSlice';
import type { UpdateSkuStatusThunkArgs } from '@features/sku/state';

/**
 * Hook providing a clean interface for updating SKU status.
 *
 * Exposes:
 *  - updateStatus: dispatch the updateSkuStatusThunk
 *  - reset: reset slice state
 *  - loading, error, success
 *  - data: API response payload
 *  - updatedSkuId: ID of the SKU with updated status
 */
const useSkuStatus = () => {
  const dispatch = useAppDispatch();
  
  // --- Selectors ---
  const data = useAppSelector(selectSkuStatusData);
  const loading = useAppSelector(selectSkuStatusLoading);
  const error = useAppSelector(selectSkuStatusError);
  const isSuccess = useAppSelector(selectSkuStatusSuccess);
  const updatedSkuId = useAppSelector(selectUpdatedSkuId);
  
  // -----------------------------
  // Update handler
  // -----------------------------
  const updateStatus = useCallback(
    async (payload: UpdateSkuStatusThunkArgs) => {
      return dispatch(updateSkuStatusThunk(payload));
    },
    [dispatch]
  );
  
  // -----------------------------
  // Reset handler
  // -----------------------------
  const reset = useCallback(() => {
    dispatch(resetSkuStatus());
  }, [dispatch]);
  
  // -----------------------------
  // Memoized API surface
  // -----------------------------
  return useMemo(
    () => ({
      // state
      data,
      loading,
      error,
      isSuccess,
      updatedSkuId,
      
      // actions
      updateStatus,
      reset,
    }),
    [
      data,
      loading,
      error,
      isSuccess,
      updatedSkuId,
      updateStatus,
      reset,
    ]
  );
};

export default useSkuStatus;
