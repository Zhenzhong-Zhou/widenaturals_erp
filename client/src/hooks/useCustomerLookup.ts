import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type CustomerLookupQuery,
  fetchCustomerLookupThunk,
  selectCustomerLookupError,
  selectCustomerLookupItems,
  selectCustomerLookupLoading,
  selectCustomerLookupOptions,
} from '@features/lookup/state';

/**
 * Hook to access customer lookup state and trigger lookup fetching.
 *
 * @param initialParams - Optional query params (e.g., keyword, limit, offset)
 * @returns Object containing items, loading, error, options, and fetch trigger
 */
const useCustomerLookup = (initialParams?: CustomerLookupQuery) => {
  const dispatch = useAppDispatch();
  
  // Capture initialParams in a ref to ensure stability in useCallback
  const initialParamsRef = useRef(initialParams);
  
  const items = useAppSelector(selectCustomerLookupItems);
  const loading = useAppSelector(selectCustomerLookupLoading);
  const error = useAppSelector(selectCustomerLookupError);
  const options = useAppSelector(selectCustomerLookupOptions);
  
  // Memoized trigger for refetching
  const fetchLookup = useCallback(
    (params?: CustomerLookupQuery) => {
      dispatch(fetchCustomerLookupThunk(params ?? initialParamsRef.current));
    },
    [dispatch] // no dependency on `initialParams`
  );
  
  // Auto-fetch on mount if initialParams provided
  useEffect(() => {
    if (initialParamsRef.current) {
      fetchLookup();
    }
  }, [fetchLookup]);
  
  return {
    items,
    loading,
    error,
    options,
    fetchLookup,
  };
};

export default useCustomerLookup;
