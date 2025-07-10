import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchCustomerAddressesThunk,
  selectCustomerAddressError,
  selectCustomerAddresses,
  selectCustomerAddressLoading
} from '@features/address/state';

/**
 * Hook to access customer address list and related loading/error states.
 * Also provides a dispatcher to trigger fetching by customer ID.
 *
 */
const useCustomerAddresses = () => {
  const dispatch = useAppDispatch();
  
  const addresses = useAppSelector(selectCustomerAddresses);
  const loading = useAppSelector(selectCustomerAddressLoading);
  const error = useAppSelector(selectCustomerAddressError);
  
  // Optional: memoized fetch function
  const fetchAddresses = useCallback(
    (customerId: string) => {
      dispatch(fetchCustomerAddressesThunk(customerId));
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

export default useCustomerAddresses;
