import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type DeliveryMethodLookupQueryParams,
  fetchDeliveryMethodLookupThunk,
  selectDeliveryMethodLookupOptions,
  selectDeliveryMethodLookupError,
  selectDeliveryMethodLookupLoading,
  selectDeliveryMethodLookupMeta,
} from '@features/lookup/state';
import { clearDeliveryMethodLookup } from '@features/lookup/state/deliveryMethodLookupSlice';

/**
 * Hook for accessing delivery method lookup state and actions.
 *
 * Provides memoized access to dropdown options, loading, error, and pagination metadata.
 * Also returns fetch and reset functions.
 */
const useDeliveryMethodLookup = () => {
  const dispatch = useAppDispatch();
  
  const dropdownOptions = useAppSelector(selectDeliveryMethodLookupOptions);
  const loading = useAppSelector(selectDeliveryMethodLookupLoading);
  const error = useAppSelector(selectDeliveryMethodLookupError);
  const meta = useAppSelector(selectDeliveryMethodLookupMeta);
  
  const fetch = useCallback(
    (params?: DeliveryMethodLookupQueryParams) => {
      dispatch(fetchDeliveryMethodLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(clearDeliveryMethodLookup());
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

export default useDeliveryMethodLookup;
