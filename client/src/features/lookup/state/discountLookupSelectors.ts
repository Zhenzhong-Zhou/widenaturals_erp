import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';
import type {
  DiscountLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the discount lookup slice.
 */
const selectDiscountLookupState = (state: RootState) =>
  selectRuntime(state).discountLookup;

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
export const selectDiscountLookupMeta = createLookupMetaSelector(
  selectDiscountLookupState
);

/**
 * Selector that transforms discount lookup items into dropdown options.
 *
 * Each option includes:
 * - `label` and `value` for dropdown components (with `value` = discount `id`)
 * - `isActive` flag to indicate if the discount is currently active
 * - `isValidToday` flag to indicate if the discount is valid on the current date
 *
 * Suitable for use in Autocomplete, Select, and other dropdown UI components
 * that need to display discounts with status/validity context.
 */
export const selectDiscountDropdownOptions = createSelector(
  [selectDiscountLookupItems],
  (items: DiscountLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive', 'isValidToday'])
);
