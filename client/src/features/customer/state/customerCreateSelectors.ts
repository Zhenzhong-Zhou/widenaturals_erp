import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { CustomerResponse } from '@features/customer/state/customerTypes';

/**
 * Base selector for the customer creation state slice.
 *
 * Responsibilities:
 * - Extract the customer creation state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectCustomerCreateState = (state: RootState) =>
  selectRuntime(state).customerCreate;

/**
 * Selects whether the customer creation request is currently loading.
 */
export const selectCustomerCreateLoading = createSelector(
  [selectCustomerCreateState],
  (customerCreate) => customerCreate.loading
);

/**
 * Selects any error message from the customer creation request.
 */
export const selectCustomerCreateError = createSelector(
  [selectCustomerCreateState],
  (customerCreate) => customerCreate.error
);

/**
 * Selects the normalized customer creation response.
 *
 * Returns an object containing:
 * - success: boolean
 * - message: string
 * - data: CustomerResponse[]
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
 * Selects and memoizes the full names of created customers.
 *
 * Each entry is formatted as "Firstname Lastname".
 * Defaults to an empty array when no customers are present.
 */
export const selectCreatedCustomerNames = createSelector(
  [selectCustomerCreateState],
  (customerCreate) =>
    customerCreate.data?.map(
      (customer: CustomerResponse) =>
        `${customer.firstname} ${customer.lastname}`
    ) ?? []
);
