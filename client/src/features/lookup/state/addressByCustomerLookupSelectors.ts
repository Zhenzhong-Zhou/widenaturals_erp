import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector to access the addressByCustomerLookup slice from the root state.
 */
const selectAddressByCustomerLookupState= createSelector(
  [selectRuntime],
  (runtime) => runtime.addressByCustomer
);

/**
 * Selector to retrieve the list of addresses from the customer-address lookup.
 *
 * @returns {AddressByCustomerLookup[]} Array of transformed address objects
 */
export const selectCustomerAddressLookupData = createSelector(
  [selectAddressByCustomerLookupState],
  (state) => state.data
);

/**
 * Selector to determine if the customer-address lookup is in progress.
 *
 * @returns {boolean} True if loading, false otherwise
 */
export const selectCustomerAddressLookupLoading = createSelector(
  [selectAddressByCustomerLookupState],
  (state) => state.loading
);

/**
 * Selector to retrieve the error message from customer-address lookup.
 *
 * @returns {string | null} Error message or null if no error
 */
export const selectCustomerAddressLookupError = createSelector(
  [selectAddressByCustomerLookupState],
  (state) => state.error
);
