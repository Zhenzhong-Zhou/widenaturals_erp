import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";

// Base state selector
const selectCustomerState = (state: RootState) => state.customers;

// Select customers list
export const selectCustomers = createSelector(
  [selectCustomerState],
  (customerState) => customerState.customers
);

// Select loading state
export const selectCustomersLoading = createSelector(
  [selectCustomerState],
  (customerState) => customerState.loading
);

// Select error state
export const selectCustomersError = createSelector(
  [selectCustomerState],
  (customerState) => customerState.error
);
