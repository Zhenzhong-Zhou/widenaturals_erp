import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type SkuCodeBaseLookupParams,
  fetchSkuCodeBaseLookupThunk,
  selectSkuCodeBaseLookupOptions,
  selectSkuCodeBaseLookupError,
  selectSkuCodeBaseLookupLoading,
  selectSkuCodeBaseLookupMeta,
} from '@features/lookup/state';
import { resetSkuCodeBaseLookup } from '@features/lookup/state/skuCodeBaseLookupSlice';

/**
 * Hook for accessing SKU Code Base lookup state and actions.
 *
 * Provides memoized dropdown options, loading, error, pagination metadata,
 * and fetch/reset helpers.
 */
const useSkuCodeBaseLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectSkuCodeBaseLookupOptions);
  const loading = useAppSelector(selectSkuCodeBaseLookupLoading);
  const error = useAppSelector(selectSkuCodeBaseLookupError);
  const meta = useAppSelector(selectSkuCodeBaseLookupMeta);
  
  const fetch = useCallback(
    (params?: SkuCodeBaseLookupParams) => {
      dispatch(fetchSkuCodeBaseLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetSkuCodeBaseLookup());
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

export default useSkuCodeBaseLookup;
