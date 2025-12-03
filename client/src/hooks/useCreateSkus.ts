import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectCreateSkusData,
  selectCreateSkusError,
  selectCreateSkusLoading,
  selectCreateSkusSuccess,
  selectCreatedSkuCodes,
  type CreateSkuBulkInput,
  createSkusThunk,
} from '@features/sku/state';
import { resetCreateSkusState } from '@features/sku/state/createSkusSlice';

/**
 * Hook providing a complete interface for creating SKUs.
 *
 * Exposes:
 *  - submit: dispatch the createSkusThunk
 *  - reset: reset slice state
 *  - loading, error, success
 *  - data: API response payload
 *  - createdSkuCodes: array of created SKU codes
 */
const useCreateSkus = () => {
  const dispatch = useAppDispatch();

  // --- Selectors ---
  const data = useAppSelector(selectCreateSkusData);
  const loading = useAppSelector(selectCreateSkusLoading);
  const error = useAppSelector(selectCreateSkusError);
  const isSuccess = useAppSelector(selectCreateSkusSuccess);
  const createdSkuCodes = useAppSelector(selectCreatedSkuCodes);

  // -----------------------------
  // Submit handler
  // -----------------------------
  const submit = useCallback(
    async (payload: CreateSkuBulkInput) => {
      return dispatch(createSkusThunk(payload));
    },
    [dispatch]
  );

  // -----------------------------
  // Reset handler
  // -----------------------------
  const reset = useCallback(() => {
    dispatch(resetCreateSkusState());
  }, [dispatch]);

  // -----------------------------
  // Memoize returned object
  // -----------------------------
  return useMemo(
    () => ({
      // state
      data,
      loading,
      error,
      isSuccess,
      createdSkuCodes,

      // actions
      submit,
      reset,
    }),
    [data, loading, error, isSuccess, createdSkuCodes, submit, reset]
  );
};

export default useCreateSkus;
