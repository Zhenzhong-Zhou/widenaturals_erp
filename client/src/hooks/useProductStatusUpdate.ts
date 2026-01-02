import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectProductStatusUpdateData,
  selectProductStatusUpdateLoading,
  selectProductStatusUpdateError,
  selectProductStatusUpdateSuccess,
  selectUpdatedProductStatusId,
  updateProductStatusByIdThunk,
  resetProductStatusUpdate,
} from '@features/product/state';
import type { UpdateProductStatusThunkArgs } from '@features/product/state';

/**
 * Hook providing a clean interface for updating a product's status.
 *
 * Exposes:
 *  - updateStatus: dispatch the updateProductStatusByIdThunk
 *  - reset: reset slice state
 *  - loading, error, isSuccess
 *  - data: API response envelope
 *  - updatedProductId: ID of the product whose status was updated
 */
const useProductStatusUpdate = () => {
  const dispatch = useAppDispatch();

  // --- Selectors ---
  const data = useAppSelector(selectProductStatusUpdateData);
  const loading = useAppSelector(selectProductStatusUpdateLoading);
  const error = useAppSelector(selectProductStatusUpdateError);
  const isSuccess = useAppSelector(selectProductStatusUpdateSuccess);
  const updatedProductId = useAppSelector(selectUpdatedProductStatusId);

  // --- Action: Update status ---
  const updateStatus = useCallback(
    async (args: UpdateProductStatusThunkArgs) => {
      return dispatch(updateProductStatusByIdThunk(args));
    },
    [dispatch]
  );

  // --- Action: Reset slice ---
  const reset = useCallback(() => {
    dispatch(resetProductStatusUpdate());
  }, [dispatch]);

  // --- Public API ---
  return useMemo(
    () => ({
      data,
      loading,
      error,
      isSuccess,
      updatedProductId,

      updateStatus,
      reset,
    }),
    [data, loading, error, isSuccess, updatedProductId, updateStatus, reset]
  );
};

export default useProductStatusUpdate;
