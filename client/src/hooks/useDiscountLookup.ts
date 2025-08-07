import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type DiscountLookupQueryParams,
  fetchDiscountLookupThunk,
  selectDiscountDropdownOptions,
  selectDiscountLookupError,
  selectDiscountLookupLoading,
  selectDiscountLookupMeta,
} from '@features/lookup/state';
import { clearDiscountLookup } from '@features/lookup/state/discountLookupSlice';

/**
 * Hook for accessing discount lookup state and actions.
 *
 * Provides memoized access to dropdown options, loading, error, and pagination metadata.
 * Also returns fetch and reset functions.
 */
const useDiscountLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectDiscountDropdownOptions);
  const loading = useAppSelector(selectDiscountLookupLoading);
  const error = useAppSelector(selectDiscountLookupError);
  const meta = useAppSelector(selectDiscountLookupMeta);
  
  const fetch = useCallback(
    (params?: DiscountLookupQueryParams) => {
      dispatch(fetchDiscountLookupThunk(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(clearDiscountLookup());
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

export default useDiscountLookup;
