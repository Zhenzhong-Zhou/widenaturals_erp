import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchCustomerAddressesLookupThunk,
  selectCustomerAddressLookupData,
  selectCustomerAddressLookupError,
  selectCustomerAddressLookupLoading,
} from '@features/lookup/state';

/**
 * Hook to access customer-address lookup data and related loading/error states.
 * Also provides a dispatcher to trigger fetching by customer ID.
 */
const useCustomerAddressesLookup = () => {
  const dispatch = useAppDispatch();
  
  const addresses = useAppSelector(selectCustomerAddressLookupData);
  const loading = useAppSelector(selectCustomerAddressLookupLoading);
  const error = useAppSelector(selectCustomerAddressLookupError);
  
  // Memoized fetch function using the lookup thunk
  const fetchAddresses = useCallback(
    (customerId: string) => {
      dispatch(fetchCustomerAddressesLookupThunk(customerId));
    },
    [dispatch]
  );
  
  return {
    addresses,
    loading,
    error,
    fetchAddresses,
  };
};

export default useCustomerAddressesLookup;
