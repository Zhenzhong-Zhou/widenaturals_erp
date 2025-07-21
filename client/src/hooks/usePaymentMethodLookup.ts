import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaymentMethodLookup,
  type PaymentMethodLookupQueryParams,
  selectPaymentMethodError,
  selectPaymentMethodHasMore,
  selectPaymentMethodLoading,
  selectPaymentMethodOffset,
  selectPaymentMethodOptions,
} from '@features/lookup/state';
import { resetPaymentMethodLookup } from '@features/lookup/state/paymentMethodLookupSlice';

/**
 * Hook to access payment method lookup state from the Redux store.
 *
 * Returns loading status, error, options, pagination info,
 * and dispatchable functions to fetch or reset lookup results.
 */
const usePaymentMethodLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectPaymentMethodOptions);
  const loading = useAppSelector(selectPaymentMethodLoading);
  const error = useAppSelector(selectPaymentMethodError);
  const hasMore = useAppSelector(selectPaymentMethodHasMore);
  const offset = useAppSelector(selectPaymentMethodOffset);
  
  /**
   * Memoized fetch thunk dispatcher.
   */
  const fetch = useCallback(
    (params?: PaymentMethodLookupQueryParams) => {
      dispatch(fetchPaymentMethodLookup(params));
    },
    [dispatch]
  );
  
  /**
   * Memoized reset action dispatcher.
   */
  const reset = useCallback(() => {
    dispatch(resetPaymentMethodLookup());
  }, [dispatch]);
  
  /**
   * Return memoized lookup object.
   */
  return useMemo(
    () => ({
      options,
      loading,
      error,
      hasMore,
      offset,
      fetch,
      reset,
    }),
    [options, loading, error, hasMore, offset, fetch, reset]
  );
};

export default usePaymentMethodLookup;
