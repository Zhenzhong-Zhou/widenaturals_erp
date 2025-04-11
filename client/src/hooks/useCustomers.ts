import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  type BulkCustomerRequest,
  createBulkCustomersThunk,
  createCustomerThunk,
  type CustomerQueryParams,
  fetchCustomersThunk,
  fetchCustomerByIdThunk,
  selectCustomerError,
  selectCustomerLoading,
  selectCustomerPagination,
  selectCustomers,
  selectCustomersCreate,
  selectCustomersCreateError,
  selectCustomersCreateLoading,
  selectCustomerDetail,
  selectCustomerDetailLoading,
  selectCustomerDetailError,
} from '@features/customer';

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

  // Customer detail selectors
  const customerDetail = useAppSelector(selectCustomerDetail);
  const customerDetailLoading = useAppSelector(selectCustomerDetailLoading);
  const customerDetailError = useAppSelector(selectCustomerDetailError);

  // Fetch customers with optional query parameters
  const fetchCustomers = useCallback(
    (
      params: CustomerQueryParams = {
        page: 1,
        limit: 10,
        sortBy: 'created_at',
        sortOrder: 'DESC',
      }
    ) => {
      dispatch(fetchCustomersThunk(params));
    },
    [dispatch]
  );

  // Fetch a specific customer by ID
  const fetchCustomerDetail = useCallback(
    (customerId: string) => dispatch(fetchCustomerByIdThunk(customerId)),
    [dispatch]
  );

  // Create a single customer
  const createCustomer = useCallback(
    (customer: BulkCustomerRequest) => dispatch(createCustomerThunk(customer)),
    [dispatch]
  );

  // Create multiple customers (bulk insert)
  const createBulkCustomers = useCallback(
    (customers: BulkCustomerRequest) =>
      dispatch(createBulkCustomersThunk(customers)),
    [dispatch]
  );

  // Automatically fetch customers on mount (optional)
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Manual refresh function for user-triggered actions (e.g., button click)
  const refreshCustomers = useCallback(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Manual refresh function for customer detail
  const refreshCustomerDetail = useCallback(
    (customerId: string) => {
      fetchCustomerDetail(customerId);
    },
    [fetchCustomerDetail]
  );

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
    refreshCustomers,
    customerDetail,
    customerDetailLoading,
    customerDetailError,
    fetchCustomerDetail,
    refreshCustomerDetail,
  };
};

export default useCustomers;
