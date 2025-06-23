import { useAppDispatch, useAppSelector } from '@store/storeHooks';
import {
  selectCustomerCreateError,
  selectCustomerCreateLoading,
  selectCreatedCustomers,
  selectCreatedCustomerNames,
} from '@features/customer/state/customerCreateSelectors';
import { createCustomersThunk, type CreateCustomersRequest } from '@features/customer/state';
import { resetCustomerCreateState } from '@features/customer/state/customerCreateSlice';

/**
 * Custom hook to access memoized customer creation state.
 * Automatically tracks loading, error, created customers, and their names.
 */
const useCustomerCreate = () => {
  const dispatch = useAppDispatch();
  
  const loading = useAppSelector(selectCustomerCreateLoading);
  const error = useAppSelector(selectCustomerCreateError);
  const customers = useAppSelector(selectCreatedCustomers);
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
  const resetCustomerCreate = () => {
    dispatch(resetCustomerCreateState());
  };
  
  return {
    loading,
    error,
    customers,
    customerNames,
    createCustomers,
    resetCustomerCreate,
  };
}

export default useCustomerCreate;
