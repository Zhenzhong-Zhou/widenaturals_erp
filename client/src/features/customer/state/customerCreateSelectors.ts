import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { CustomerResponse } from '@features/customer/state/customerTypes';

/**
 * Base selector for accessing the customer creation slice state.
 */
const selectCustomerCreateState = (state: RootState) => state.customerCreate;

/**
 * Selector to get the loading status of the customer creation request.
 */
export const selectCustomerCreateLoading = createSelector(
  [selectCustomerCreateState],
  (customerCreate) => customerCreate.loading
);

/**
 * Selector to get any error message from the customer creation request.
 */
export const selectCustomerCreateError = createSelector(
  [selectCustomerCreateState],
  (customerCreate) => customerCreate.error
);

/**
 * Selector to retrieve the full list of successfully created customers.
 */
export const selectCreatedCustomers = createSelector(
  [selectCustomerCreateState],
  (customerCreate) => customerCreate.data
);

/**
 * Selector to derive and memoize the full names of created customers.
 * Returns an array of formatted strings: "Firstname Lastname".
 */
export const selectCreatedCustomerNames = createSelector(
  [selectCustomerCreateState],
  (customerCreate) =>
    customerCreate.data?.map((customer: CustomerResponse) =>
      `${customer.firstname} ${customer.lastname}`
    ) || []
);
