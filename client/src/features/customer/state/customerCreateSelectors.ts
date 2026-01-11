import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';
import type { CustomerResponse } from '@features/customer/state/customerTypes';

/**
 * Base selector for accessing the customer creation slice state.
 */
const selectCustomerCreateState = createSelector(
  [selectRuntime],
  (runtime) => runtime.customerCreate
);

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
 * Selector to retrieve the full response after customer creation.
 * Includes success flag, message, and created customer data.
 */
export const selectCustomerCreateResponse = createSelector(
  [selectCustomerCreateState],
  (customerCreate) => ({
    success: customerCreate.success ?? false,
    message: customerCreate.message ?? '',
    data: customerCreate.data ?? [],
  })
);

/**
 * Selector to derive and memoize the full names of created customers.
 * Returns an array of formatted strings: "Firstname Lastname".
 */
export const selectCreatedCustomerNames = createSelector(
  [selectCustomerCreateState],
  (customerCreate) =>
    customerCreate.data?.map(
      (customer: CustomerResponse) =>
        `${customer.firstname} ${customer.lastname}`
    ) || []
);
