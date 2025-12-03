import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type ProductLookupParams,
  fetchProductLookupThunk,
  selectProductLookupOptions,
  selectProductLookupError,
  selectProductLookupLoading,
  selectProductLookupMeta,
} from '@features/lookup/state';
import { resetProductLookup } from '@features/lookup/state/productLookupSlice';

/**
 * Hook for accessing Product lookup state and actions.
 *
 * Provides memoized dropdown options, loading, error, pagination metadata,
 * and fetch/reset helpers.
 */
const useProductLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectProductLookupOptions);
  const loading = useAppSelector(selectProductLookupLoading);
  const error = useAppSelector(selectProductLookupError);
  const meta = useAppSelector(selectProductLookupMeta);

  const fetch = useCallback(
    (params?: ProductLookupParams) => {
      dispatch(fetchProductLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetProductLookup());
  }, [dispatch]);

  return useMemo(
    () => ({
      options,
      loading,
      error,
      meta,
      fetch,
      reset,
    }),
    [options, loading, error, meta, fetch, reset]
  );
};

export default useProductLookup;
