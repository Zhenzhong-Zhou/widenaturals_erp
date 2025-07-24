import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type TaxRateLookupQueryParams,
  fetchTaxRateLookupThunk,
  selectTaxRateDropdownOptions,
  selectTaxRateLookupError,
  selectTaxRateLookupLoading,
  selectTaxRateLookupMeta,
} from '@features/lookup/state';
import { clearTaxRateLookup } from '@features/lookup/state/taxRateLookupSlice';

/**
 * Hook for accessing tax rate lookup state and actions.
 *
 * Provides memoized access to dropdown options, loading, error, and pagination metadata.
 * Also returns fetch and reset functions.
 */
const useTaxRateLookup = () => {
  const dispatch = useAppDispatch();
  
  const dropdownOptions = useAppSelector(selectTaxRateDropdownOptions);
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
    dispatch(clearTaxRateLookup());
  }, [dispatch]);
  
  return useMemo(
    () => ({
      dropdownOptions,
      loading,
      error,
      meta,
      fetch,
      reset,
    }),
    [dropdownOptions, loading, error, meta, fetch, reset]
  );
};

export default useTaxRateLookup;
