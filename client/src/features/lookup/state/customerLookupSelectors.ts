import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';

/**
 * Base selector for the customer lookup slice.
 *
 * Internal-only extraction selector.
 * MUST remain a plain function.
 */
const selectCustomerLookupState = (state: RootState) =>
  selectRuntime(state).customerLookup;

/**
 * Selects raw customer lookup items.
 */
export const selectCustomerLookupItems = createSelector(
  [selectCustomerLookupState],
  (state) => state.data
);

/**
 * Selects loading state for the customer lookup request.
 */
export const selectCustomerLookupLoading = createSelector(
  [selectCustomerLookupState],
  (state) => state.loading
);

/**
 * Selects error message from the customer lookup slice, if any.
 */
export const selectCustomerLookupError = createSelector(
  [selectCustomerLookupState],
  (state) => state.error
);

/**
 * Selects lookup pagination metadata.
 *
 * Returns `{ hasMore, limit, offset }`.
 */
export const selectCustomerLookupMeta = createLookupMetaSelector(
  selectCustomerLookupState
);

/**
 * Maps customer lookup items into dropdown-ready options.
 *
 * Each option includes:
 * - `label`
 * - `value`
 * - `hasAddress`
 * - `isActive`
 */
export const selectCustomerLookupOptions = createSelector(
  [selectCustomerLookupItems],
  (items) => mapLookupItems(items, ['hasAddress', 'isActive'])
);
