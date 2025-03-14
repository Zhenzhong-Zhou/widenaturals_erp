import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

// Base state selector
const selectCustomerCreateState = (state: RootState) => state.customersCreate;

// Select customers list
export const selectCustomersCreate = createSelector(
  [selectCustomerCreateState],
  (customerState) => customerState.customers
);

// Select loading state
export const selectCustomersCreateLoading = createSelector(
  [selectCustomerCreateState],
  (customerState) => customerState.loading
);

// Select error state
export const selectCustomersCreateError = createSelector(
  [selectCustomerCreateState],
  (customerState) => customerState.error
);
