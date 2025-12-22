import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchCustomerAddressesLookupThunk,
  selectCustomerAddressLookupData,
  selectCustomerAddressLookupError,
  selectCustomerAddressLookupLoading,
} from '@features/lookup/state';
import { resetAddressByCustomerLookup } from '@features/lookup/state/addressByCustomerLookupSlice';

/**
 * Hook to access customer-address lookup data and related loading/error states.
 * Also provides dispatchers to trigger fetching by customer ID and to reset state.
 */
const useCustomerAddressesLookup = () => {
  const dispatch = useAppDispatch();

  const options = useAppSelector(selectCustomerAddressLookupData);
  const loading = useAppSelector(selectCustomerAddressLookupLoading);
  const error = useAppSelector(selectCustomerAddressLookupError);

  /**
   * Triggers address lookup by customer ID.
   */
  const fetch = useCallback(
    (customerId: string) => {
      dispatch(fetchCustomerAddressesLookupThunk(customerId));
    },
    [dispatch]
  );

  /**
   * Resets customer address lookup state (data, loading, error).
   */
  const reset = useCallback(() => {
    dispatch(resetAddressByCustomerLookup());
  }, [dispatch]);

  return useMemo(
    () => ({
      options,
      loading,
      error,
      fetch,
      reset,
    }),
    [options, loading, error, fetch, reset]
  );
};

export default useCustomerAddressesLookup;
