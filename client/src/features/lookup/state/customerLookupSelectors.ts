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
 * @returns An array of customer lookup items
 */
export const selectCustomerLookupItems = createSelector(
  [selectCustomerLookupState],
  (state) => state.data
);

/**
 * Selector to retrieve the loading status of the customer lookup request.
 *
 * @returns A boolean indicating loading state
 */
export const selectCustomerLookupLoading = createSelector(
  [selectCustomerLookupState],
  (state) => state.loading
);

/**
 * Selector to retrieve any error message from the customer lookup request.
 *
 * @returns A string error message or null if no error
 */
export const selectCustomerLookupError = createSelector(
  [selectCustomerLookupState],
  (state) => state.error
);

/**
 * Selector to retrieve pagination metadata for the customer lookup.
 *
 * @returns An object containing `hasMore`, `limit`, and `offset`
 */
export const selectCustomerLookupMeta = createSelector(
  [selectCustomerLookupState],
  (state) => ({
    hasMore: state.hasMore,
    limit: state.limit,
    offset: state.offset,
  })
);

/**
 * Selector to transform customer lookup items into `{ label, value, hasAddress }` format.
 *
 * This is useful for dropdowns or autocomplete components that need to display
 * whether a customer has an associated address.
 *
 * @returns An array of customer options with `label`, `value`, and `hasAddress` fields
 */
export const selectCustomerLookupOptions = createSelector(
  [selectCustomerLookupItems],
  (items: CustomerLookupItem[]): { label: string; value: string; hasAddress: boolean }[] =>
    items.map((item) => ({
      label: item.label,
      value: item.id,
      hasAddress: item.hasAddress ?? false,
    }))
);
