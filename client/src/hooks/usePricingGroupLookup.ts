import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPricingGroupLookupThunk,
  selectPricingGroupLookupOptions,
  selectPricingGroupLookupLoading,
  selectPricingGroupLookupError,
  selectPricingGroupLookupMeta,
} from '@features/lookup/state';
import type { PricingGroupLookupQueryParams } from '@features/lookup/state';
import { resetPricingGroupLookup } from '@features/lookup/state/pricingGroupLookupSlice';

/**
 * Hook to access pricing group lookup state and utility actions.
 *
 * Does not trigger fetch automatically — call `fetch()` to retrieve data.
 * Provides dropdown options, loading/error state, and pagination metadata.
 *
 * @returns Enriched state, dropdown options, fetch/reset actions, and pagination info.
 */
const usePricingGroupLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectPricingGroupLookupOptions);
  const loading = useAppSelector(selectPricingGroupLookupLoading);
  const error = useAppSelector(selectPricingGroupLookupError);
  const meta = useAppSelector(selectPricingGroupLookupMeta);
  
  const fetch = useCallback(
    (params?: PricingGroupLookupQueryParams) => {
      dispatch(fetchPricingGroupLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetPricingGroupLookup());
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

export default usePricingGroupLookup;
