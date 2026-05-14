import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPricingTypeLookupThunk,
  selectPricingTypeLookupOptions,
  selectPricingTypeLookupError,
  selectPricingTypeLookupLoading,
  selectPricingTypeLookupMeta,
} from '@features/lookup/state';
import type { PricingTypeLookupParams } from '@features/lookup/state';
import { resetPricingTypeLookup } from '@features/lookup/state/pricingTypeLookupSlice';

/**
 * Hook for accessing Pricing Type lookup state and actions.
 */
const usePricingTypeLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectPricingTypeLookupOptions);
  const loading = useAppSelector(selectPricingTypeLookupLoading);
  const error = useAppSelector(selectPricingTypeLookupError);
  const meta = useAppSelector(selectPricingTypeLookupMeta);

  const fetch = useCallback(
    (params?: PricingTypeLookupParams) => {
      dispatch(fetchPricingTypeLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetPricingTypeLookup());
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

export default usePricingTypeLookup;
