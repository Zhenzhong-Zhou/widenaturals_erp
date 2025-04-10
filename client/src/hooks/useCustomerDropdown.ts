import { useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  fetchCustomersForDropdownThunk,
  selectCustomerDropdownData,
  selectCustomerDropdownError,
  selectCustomerDropdownLoading,
} from '@features/customer';

/**
 * Custom hook for managing customer dropdown data.
 * @param {boolean} autoFetch - Whether to auto-fetch customers on mount (default: true).
 * @returns {{
 *   customers: { id: string, label: string }[];
 *   loading: boolean;
 *   error: string | null;
 *   fetchCustomers: (search?: string, limit?: number) => void;
 * }}
 */
const useCustomerDropdown = (autoFetch: boolean = true): {
    customers: { id: string; label: string; }[];
    loading: boolean;
    error: string | null;
    fetchCustomers: (search?: string, limit?: number) => void;
} => {
  const dispatch = useAppDispatch();
  
  // Selectors
  const customers = useAppSelector(selectCustomerDropdownData);
  const loading = useAppSelector(selectCustomerDropdownLoading);
  const error = useAppSelector(selectCustomerDropdownError);
  
  // Fetch customers manually
  const fetchCustomers = (search: string = '', limit: number = 100) => {
    dispatch(fetchCustomersForDropdownThunk({ search, limit }));
  };
  
  // Auto-fetch customers on mount (optional)
  useEffect(() => {
    if (autoFetch) {
      fetchCustomers();
    }
  }, [autoFetch]);
  
  // Memoized return value
  return useMemo(() => ({
    customers,
    loading,
    error,
    fetchCustomers
  }), [customers, loading, error]);
};

export default useCustomerDropdown;
