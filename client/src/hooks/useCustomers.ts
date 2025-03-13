import { useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from '../store/storeHooks.ts';
import {
  BulkCustomerRequest, createBulkCustomersThunk,
  createCustomerThunk,
  selectCustomers,
  selectCustomersError,
  selectCustomersLoading,
} from '../features/customer';


const useCustomers = () => {
  const dispatch = useAppDispatch();
  
  // Redux selectors
  const customers = useAppSelector(selectCustomers);
  const loading = useAppSelector(selectCustomersLoading);
  const error = useAppSelector(selectCustomersError);
  
  // Function to create a single customer
  const createCustomer = useCallback(
    (customer: BulkCustomerRequest) => dispatch(createCustomerThunk(customer)),
    [dispatch]
  );
  
  // Function to create multiple customers
  const createBulkCustomers = useCallback(
    (customers: BulkCustomerRequest) => dispatch(createBulkCustomersThunk(customers)),
    [dispatch]
  );
  
  // Fetch customers when the hook is first used (if needed)
  useEffect(() => {
    if (customers.length === 0) {
      // Future implementation: Dispatch a `fetchCustomersThunk` when needed
    }
  }, [customers.length]);
  
  return {
    customers,
    loading,
    error,
    createCustomer,
    createBulkCustomers,
  };
};

export default useCustomers;
