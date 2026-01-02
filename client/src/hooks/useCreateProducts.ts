import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectCreateProductsData,
  selectCreateProductsLoading,
  selectCreateProductsError,
  selectCreateProductsSuccess,
  selectCreatedProductIds,
  createProductsThunk,
  resetCreateProducts,
} from '@features/product/state';
import type { CreateProductBulkInput } from '@features/product/state';

/**
 * Hook providing a complete interface for creating Products.
 *
 * Exposes:
 *  - submit: dispatch the createProductsThunk
 *  - reset: reset slice state
 *  - loading, error, success
 *  - data: API response payload
 *  - createdProductIds: array of created product UUIDs
 */
const useCreateProducts = () => {
  const dispatch = useAppDispatch();

  // --- Selectors ---
  const data = useAppSelector(selectCreateProductsData);
  const loading = useAppSelector(selectCreateProductsLoading);
  const error = useAppSelector(selectCreateProductsError);
  const isSuccess = useAppSelector(selectCreateProductsSuccess);
  const createdProductIds = useAppSelector(selectCreatedProductIds);

  // -----------------------------
  // Submit handler
  // -----------------------------
  const submit = useCallback(
    async (payload: CreateProductBulkInput) => {
      return dispatch(createProductsThunk(payload));
    },
    [dispatch]
  );

  // -----------------------------
  // Reset handler
  // -----------------------------
  const reset = useCallback(() => {
    dispatch(resetCreateProducts());
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
      createdProductIds,

      // actions
      submit,
      reset,
    }),
    [data, loading, error, isSuccess, createdProductIds, submit, reset]
  );
};

export default useCreateProducts;
