import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type CustomerLookupQuery,
  fetchCustomerLookupThunk,
  selectCustomerLookupLoading,
  selectCustomerLookupError,
  selectCustomerLookupOptions,
  selectCustomerLookupMeta,
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
  const meta = useAppSelector(selectCustomerLookupMeta); // { hasMore, limit, offset }
  
  // Memoized trigger for refetching
  const fetchLookup = useCallback(
    (params?: CustomerLookupQuery) => {
      dispatch(fetchCustomerLookupThunk(params ?? initialParamsRef.current));
    },
    [dispatch]
  );
  
  // Auto-fetch on mount if initialParams provided
  useEffect(() => {
    if (autoFetch && initialParamsRef.current) {
      fetchLookup();
    }
  }, [autoFetch, fetchLookup]);
  
  return {
    options,
    loading,
    error,
    meta, // Grouped pagination info
    fetchLookup,
  };
};

export default useCustomerLookup;
