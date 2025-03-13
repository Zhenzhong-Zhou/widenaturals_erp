import { createSelector } from "@reduxjs/toolkit";
import { RootState } from "../../../store/store";

// Base state selector
const selectCustomerDetailState = (state: RootState) => state.customerDetail;

// Memoized selector to get customer details
export const selectCustomerDetail = createSelector(
  [selectCustomerDetailState],
  (customerDetailState) => customerDetailState.customer
);

// Memoized selector to get loading state
export const selectCustomerDetailLoading = createSelector(
  [selectCustomerDetailState],
  (customerDetailState) => customerDetailState.loading
);

// Memoized selector to get error state
export const selectCustomerDetailError = createSelector(
  [selectCustomerDetailState],
  (customerDetailState) => customerDetailState.error
);
