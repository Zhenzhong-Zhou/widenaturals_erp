import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchManufacturerLookupThunk,
  selectManufacturerLookupOptions,
  selectManufacturerLookupError,
  selectManufacturerLookupLoading,
  selectManufacturerLookupMeta,
} from '@features/lookup/state';
import type { ManufacturerLookupParams } from '@features/lookup/state';
import { resetManufacturerLookup } from '@features/lookup/state/manufacturerLookupSlice';

/**
 * Hook for accessing Manufacturer lookup state and actions.
 *
 * Provides memoized dropdown options, loading, error,
 * pagination metadata, and fetch/reset helpers.
 */
const useManufacturerLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectManufacturerLookupOptions);
  const loading = useAppSelector(selectManufacturerLookupLoading);
  const error = useAppSelector(selectManufacturerLookupError);
  const meta = useAppSelector(selectManufacturerLookupMeta);
  
  const fetch = useCallback(
    (params?: ManufacturerLookupParams) => {
      dispatch(fetchManufacturerLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetManufacturerLookup());
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

export default useManufacturerLookup;
