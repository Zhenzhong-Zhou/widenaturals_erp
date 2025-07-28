import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectNormalSkuLookupOptions,
  selectAbnormalSkuLookupOptions,
  selectSkuLookupLoading,
  selectSkuLookupError,
  selectSkuLookupMeta,
} from '@features/lookup/state/skuLookupSelectors';
import { resetSkuLookup } from '@features/lookup/state/skuLookupSlice';
import { fetchSkuLookupThunk, type SkuLookupQueryParams } from '@features/lookup/state';

/**
 * Hook to access SKU lookup state and utility actions.
 *
 * Does not trigger fetch automatically. Use the `fetch` method to manually retrieve results.
 * Provides both normal and abnormal SKU dropdown options and flags abnormal presence.
 *
 * @returns Enriched state, lookup options, flags, and fetch/reset functions.
 */
const useSkuLookup = () => {
  const dispatch = useAppDispatch();
  
  const normalOptions = useAppSelector(selectNormalSkuLookupOptions);
  const abnormalOptions = useAppSelector(selectAbnormalSkuLookupOptions);
  const loading = useAppSelector(selectSkuLookupLoading);
  const error = useAppSelector(selectSkuLookupError);
  const meta = useAppSelector(selectSkuLookupMeta);
  
  const hasAbnormal = useMemo(() => abnormalOptions.length > 0, [abnormalOptions]);
  
  const fetch = useCallback(
    (params?: SkuLookupQueryParams) => {
      dispatch(fetchSkuLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetSkuLookup());
  }, [dispatch]);
  
  return useMemo(() => {
    return {
      normalOptions,
      abnormalOptions,
      loading,
      error,
      hasAbnormal,
      meta,
      fetch,
      reset,
    };
  }, [normalOptions, abnormalOptions, loading, error, hasAbnormal, meta, fetch, reset]);
};

export default useSkuLookup;
