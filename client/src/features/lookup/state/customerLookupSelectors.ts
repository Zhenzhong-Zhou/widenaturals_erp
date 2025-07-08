import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { CustomerLookupItem } from './lookupTypes';

/**
 * Root selector to access the customer lookup slice from the Redux state.
 *
 * @param state - The root Redux state
 * @returns The customer lookup state slice
 */
const selectCustomerLookupState = (state: RootState) => state.customerLookup;

/**
 * Selector to retrieve the raw customer lookup items.
 *
 * @returns An array of `CustomerLookupItem` entries
 */
export const selectCustomerLookupItems = createSelector(
  [selectCustomerLookupState],
  (state) => state.data
);

/**
 * Selector to retrieve the loading status of the customer lookup request.
 *
 * @returns A boolean indicating whether the request is in progress
 */
export const selectCustomerLookupLoading = createSelector(
  [selectCustomerLookupState],
  (state) => state.loading
);

/**
 * Selector to retrieve any error message from the customer lookup request.
 *
 * @returns A string error message or `null` if no error occurred
 */
export const selectCustomerLookupError = createSelector(
  [selectCustomerLookupState],
  (state) => state.error
);

/**
 * Selector to transform customer lookup items into `{ label, value }` format.
 *
 * Useful for feeding into dropdown components or form controls.
 *
 * @returns An array of dropdown-compatible options
 */
export const selectCustomerLookupOptions = createSelector(
  [selectCustomerLookupItems],
  (items: CustomerLookupItem[]): { label: string; value: string }[] =>
    items.map((item) => ({
      label: item.label,
      value: item.id,
    }))
);
