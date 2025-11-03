import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectPricingLookupOptions,
  selectPricingLookupLoading,
  selectPricingLookupError,
  selectPricingLookupMeta,
} from '@features/lookup/state/pricingLookupSelectors';
import { resetPricingLookup } from '@features/lookup/state/pricingLookupSlice';
import {
  fetchPricingLookupThunk,
  type PricingLookupQueryParams,
} from '@features/lookup/state';

/**
 * Hook to access pricing lookup state and utility actions.
 *
 * Does not trigger fetch automatically — call `fetch()` to retrieve data.
 * Provides dropdown options, loading/error state, and pagination metadata.
 *
 * @returns Enriched state, dropdown options, fetch/reset actions, and pagination info.
 */
const usePricingLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectPricingLookupOptions);
  const loading = useAppSelector(selectPricingLookupLoading);
  const error = useAppSelector(selectPricingLookupError);
  const meta = useAppSelector(selectPricingLookupMeta);

  const fetch = useCallback(
    (params?: PricingLookupQueryParams) => {
      dispatch(fetchPricingLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetPricingLookup());
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

export default usePricingLookup;
