import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectCustomerCreateError,
  selectCustomerCreateLoading,
  selectCustomerCreateResponse,
  selectCreatedCustomerNames,
  createCustomersThunk,
  resetCustomerCreate,
} from '@features/customer/state';
import type {
  CreateCustomersRequest,
} from '@features/customer/state';

/**
 * Custom hook to access memoized customer creation state.
 * Automatically tracks loading, error, created customers, and their names.
 */
const useCustomerCreate = () => {
  const dispatch = useAppDispatch();

  const loading = useAppSelector(selectCustomerCreateLoading);
  const error = useAppSelector(selectCustomerCreateError);
  const customerCreateResponse = useAppSelector(selectCustomerCreateResponse);
  const customerNames = useAppSelector(selectCreatedCustomerNames);

  /**
   * Dispatches the thunk to create customers.
   * @param requestBody CreateCustomersRequest - an array of customers to create.
   */
  const createCustomers = async (requestBody: CreateCustomersRequest) => {
    return dispatch(createCustomersThunk(requestBody));
  };

  /**
   * Resets the customer creation state to initial.
   */
  const resetCustomerCreateState = useCallback(() => {
    dispatch(resetCustomerCreate());
  }, [dispatch]);

  return {
    loading,
    error,
    customerCreateResponse,
    customerNames,
    createCustomers,
    resetCustomerCreateState,
  };
};

export default useCustomerCreate;
