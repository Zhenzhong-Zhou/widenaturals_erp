import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchPaymentMethodLookup,
  selectPaymentMethodDropdownOptions,
  selectPaymentMethodLookupLoading,
  selectPaymentMethodLookupError,
  selectPaymentMethodLookupMeta,
  type PaymentMethodLookupQueryParams,
} from '@features/lookup/state';
import { resetPaymentMethodLookup } from '@features/lookup/state/paymentMethodLookupSlice';

/**
 * Custom hook to access payment method lookup state from Redux.
 *
 * Provides dropdown options, loading/error states, pagination info,
 * and memoized functions to fetch or reset lookup results.
 */
const usePaymentMethodLookup = () => {
  const dispatch = useAppDispatch();
  
  const options = useAppSelector(selectPaymentMethodDropdownOptions);
  const loading = useAppSelector(selectPaymentMethodLookupLoading);
  const error = useAppSelector(selectPaymentMethodLookupError);
  const { hasMore, offset } = useAppSelector(selectPaymentMethodLookupMeta);
  
  const fetch = useCallback(
    (params?: PaymentMethodLookupQueryParams) => {
      dispatch(fetchPaymentMethodLookup(params));
    },
    [dispatch]
  );
  
  const reset = useCallback(() => {
    dispatch(resetPaymentMethodLookup());
  }, [dispatch]);
  
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
