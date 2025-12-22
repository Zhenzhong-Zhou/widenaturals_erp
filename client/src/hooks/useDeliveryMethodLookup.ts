import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchDeliveryMethodLookupThunk,
  selectDeliveryMethodLookupOptions,
  selectDeliveryMethodLookupError,
  selectDeliveryMethodLookupLoading,
  selectDeliveryMethodLookupMeta,
  resetDeliveryMethodLookup,
} from '@features/lookup/state';
import type {
  DeliveryMethodLookupQueryParams,
} from '@features/lookup/state';

/**
 * Hook for accessing delivery method lookup state and actions.
 *
 * Provides memoized access to dropdown options, loading, error, and pagination metadata.
 * Also returns fetch and reset functions.
 */
const useDeliveryMethodLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectDeliveryMethodLookupOptions);
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
    dispatch(resetDeliveryMethodLookup());
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

export default useDeliveryMethodLookup;
