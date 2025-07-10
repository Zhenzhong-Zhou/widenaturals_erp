import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';

/**
 * Base selector to access the addressByCustomer slice from the root state.
 */
const selectAddressByCustomerState = (state: RootState) => state.addressByCustomer;

/**
 * Selector to retrieve the list of addresses associated with a customer.
 *
 * @returns {AddressByCustomer[]} Array of transformed address objects
 */
export const selectCustomerAddresses = createSelector(
  [selectAddressByCustomerState],
  (state) => state.data
);

/**
 * Selector to determine if the customer address fetch is in progress.
 *
 * @returns {boolean} True if loading, false otherwise
 */
export const selectCustomerAddressLoading = createSelector(
  [selectAddressByCustomerState],
  (state) => state.loading
);

/**
 * Selector to retrieve the error message from customer address fetching.
 *
 * @returns {string | null} Error message or null if no error
 */
export const selectCustomerAddressError = createSelector(
  [selectAddressByCustomerState],
  (state) => state.error
);
