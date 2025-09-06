import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  createLookupMetaSelector,
  transformIdLabel
} from '../utils/lookupSelectorUtils';
import type { DiscountLookupItem, LookupOption } from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the discount lookup slice.
 */
const selectDiscountLookupState = (state: RootState) => state.discountLookup;

/**
 * Selector for retrieving the list of discount lookup items.
 */
export const selectDiscountLookupItems = createSelector(
  [selectDiscountLookupState],
  (state) => state.data
);

/**
 * Selector for the loading state of the discount lookup fetch.
 */
export const selectDiscountLookupLoading = createSelector(
  [selectDiscountLookupState],
  (state) => state.loading
);

/**
 * Selector for any error that occurred while fetching discount lookup data.
 */
export const selectDiscountLookupError = createSelector(
  [selectDiscountLookupState],
  (state) => state.error
);

/**
 * Selects pagination metadata for the discount lookup slice.
 * Includes `hasMore`, `limit`, and `offset` used for pagination controls.
 */
export const selectDiscountLookupMeta = createLookupMetaSelector(selectDiscountLookupState);

/**
 * Selector that maps discount lookup items to dropdown options
 * with `{ label, value }`, where `value` is the item `id`.
 * Suitable for use in Autocomplete, Select, etc.
 */
export const selectDiscountDropdownOptions = createSelector(
  [selectDiscountLookupItems],
  (items: DiscountLookupItem[]): LookupOption[] => transformIdLabel(items)
);
