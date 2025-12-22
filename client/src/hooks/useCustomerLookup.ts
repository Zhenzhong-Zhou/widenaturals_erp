import { useEffect, useCallback, useRef, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import type {
  CustomerLookupQuery,
} from '@features/lookup/state';
import {
  fetchCustomerLookupThunk,
  selectCustomerLookupLoading,
  selectCustomerLookupError,
  selectCustomerLookupOptions,
  selectCustomerLookupMeta,
  resetCustomerLookup,
} from '@features/lookup/state';

/**
 * Hook to access customer lookup state and trigger customer fetching.
 *
 * @param initialParams - Optional query params (e.g., keyword, limit, offset)
 * @param autoFetch - Whether to auto-fetch on mount (default: true)
 * @returns Object containing items, options, loading, error, fetch trigger, and pagination metadata
 */
const useCustomerLookup = (
  initialParams?: CustomerLookupQuery,
  autoFetch = true
) => {
  const dispatch = useAppDispatch();

  // Capture initialParams in a ref to ensure stability in useCallback
  const initialParamsRef = useRef(initialParams);

  const options = useAppSelector(selectCustomerLookupOptions);
  const loading = useAppSelector(selectCustomerLookupLoading);
  const error = useAppSelector(selectCustomerLookupError);
  const meta = useAppSelector(selectCustomerLookupMeta);

  // Memoized fetch trigger
  const fetch = useCallback(
    (params?: CustomerLookupQuery) => {
      dispatch(fetchCustomerLookupThunk(params ?? initialParamsRef.current));
    },
    [dispatch]
  );

  // Memoized reset trigger
  const reset = useCallback(() => {
    dispatch(resetCustomerLookup());
  }, [dispatch]);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch && initialParamsRef.current) {
      fetch();
    }
  }, [autoFetch, fetch]);

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

export default useCustomerLookup;
