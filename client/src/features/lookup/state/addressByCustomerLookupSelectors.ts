import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the address-by-customer lookup slice.
 *
 * Internal-only extraction selector.
 * MUST remain a plain function.
 */
const selectAddressByCustomerLookupState = (state: RootState) =>
  selectRuntime(state).addressByCustomer;

/**
 * Selects the list of addresses returned by the customer-address lookup.
 *
 * @returns Array of address lookup records
 */
export const selectCustomerAddressLookupData = createSelector(
  [selectAddressByCustomerLookupState],
  (state) => state.data
);

/**
 * Selects loading state for the customer-address lookup request.
 *
 * @returns `true` if the lookup request is in progress
 */
export const selectCustomerAddressLookupLoading = createSelector(
  [selectAddressByCustomerLookupState],
  (state) => state.loading
);

/**
 * Selects error message from the customer-address lookup slice, if any.
 *
 * @returns Error message string or `null`
 */
export const selectCustomerAddressLookupError = createSelector(
  [selectAddressByCustomerLookupState],
  (state) => state.error
);
