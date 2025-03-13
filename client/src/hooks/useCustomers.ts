import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  BulkCustomerRequest,
  createBulkCustomersThunk,
  createCustomerThunk,
  CustomerQueryParams, fetchCustomersThunk,
  selectCustomerError,
  selectCustomerLoading,
  selectCustomerPagination,
  selectCustomers,
  selectCustomersCreate,
  selectCustomersCreateError,
  selectCustomersCreateLoading,
} from '../features/customer';

/**
 * Custom hook to manage customer-related state and actions.
 */
export const useCustomers = () => {
  const dispatch = useAppDispatch();
  
  // Redux state selectors
  const customers = useAppSelector(selectCustomersCreate);
  const loading = useAppSelector(selectCustomersCreateLoading);
  const error = useAppSelector(selectCustomersCreateError);
  
  const allCustomers = useAppSelector(selectCustomers);
  const pagination = useAppSelector(selectCustomerPagination);
  const fetchLoading = useAppSelector(selectCustomerLoading);
  const fetchError = useAppSelector(selectCustomerError);
  
  // Fetch customers with optional query parameters
  const fetchCustomers = useCallback(
    (params: CustomerQueryParams = { page: 1, limit: 10, sortBy: "created_at", sortOrder: "DESC" }) => {
      dispatch(fetchCustomersThunk(params));
    },
    [dispatch]
  );
  
  // Create a single customer
  const createCustomer = useCallback(
    (customer: BulkCustomerRequest) => dispatch(createCustomerThunk(customer)),
    [dispatch]
  );
  
  // Create multiple customers (bulk insert)
  const createBulkCustomers = useCallback(
    (customers: BulkCustomerRequest) => dispatch(createBulkCustomersThunk(customers)),
    [dispatch]
  );
  
  // Automatically fetch customers on mount (optional)
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  // Manual fetch function for user-triggered actions (e.g., button click)
  const refresh = useCallback(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  
  return {
    customers,
    loading,
    error,
    createCustomer,
    createBulkCustomers,
    allCustomers,
    pagination,
    fetchLoading,
    fetchError,
    fetchCustomers,
    refresh,
  };
};

export default useCustomers;
