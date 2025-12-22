import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchTaxRateLookupThunk,
  selectTaxRateDropdownOptions,
  selectTaxRateLookupError,
  selectTaxRateLookupLoading,
  selectTaxRateLookupMeta,
  resetTaxRateLookup,
} from '@features/lookup/state';
import type {
  TaxRateLookupQueryParams,
} from '@features/lookup/state';

/**
 * Hook for accessing tax rate lookup state and actions.
 *
 * Provides memoized access to dropdown options, loading, error, and pagination metadata.
 * Also returns fetch and reset functions.
 */
const useTaxRateLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectTaxRateDropdownOptions);
  const loading = useAppSelector(selectTaxRateLookupLoading);
  const error = useAppSelector(selectTaxRateLookupError);
  const meta = useAppSelector(selectTaxRateLookupMeta);

  const fetch = useCallback(
    (params?: TaxRateLookupQueryParams) => {
      dispatch(fetchTaxRateLookupThunk(params));
    },
    [dispatch]
  );

  const reset = useCallback(() => {
    dispatch(resetTaxRateLookup());
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

export default useTaxRateLookup;
