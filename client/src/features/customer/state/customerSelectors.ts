import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../../store/store';

// Base state selector
const selectCustomerState = (state: RootState) => state.customers;

// Select customers list
export const selectCustomers = createSelector(
  [selectCustomerState],
  (customerState) => customerState.customers
);

export const selectCustomerPagination = createSelector(
  [selectCustomerState],
  (customerState) => customerState.pagination
);

export const selectCustomerLoading = createSelector(
  [selectCustomerState],
  (customerState) => customerState.loading
);

export const selectCustomerError = createSelector(
  [selectCustomerState],
  (customerState) => customerState.error
);
