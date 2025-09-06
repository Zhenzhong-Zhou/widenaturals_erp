import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  createLookupMetaSelector,
  transformIdLabel
} from '../utils/lookupSelectorUtils';
import type {
  LookupOption,
  TaxRateLookupItem
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the tax rate lookup slice.
 */
const selectTaxRateLookupState = (state: RootState) => state.taxRateLookup;

/**
 * Selector for retrieving the list of tax rate lookup items.
 */
export const selectTaxRateLookupItems = createSelector(
  [selectTaxRateLookupState],
  (state) => state.data
);

/**
 * Selector for the loading state of the tax rate lookup fetch.
 */
export const selectTaxRateLookupLoading = createSelector(
  [selectTaxRateLookupState],
  (state) => state.loading
);

/**
 * Selector for any error that occurred while fetching tax rate lookup data.
 */
export const selectTaxRateLookupError = createSelector(
  [selectTaxRateLookupState],
  (state) => state.error
);

/**
 * Selects pagination metadata for the tax rate lookup slice.
 * Includes `hasMore`, `limit`, and `offset` used for pagination controls.
 */
export const selectTaxRateLookupMeta = createLookupMetaSelector(selectTaxRateLookupState);

/**
 * Selects transformed tax rate options for dropdown components.
 * Maps each item to `{ label, value }` using `id` as `value` and `label` as display text.
 */
export const selectTaxRateDropdownOptions = createSelector(
  [selectTaxRateLookupItems],
  (items: TaxRateLookupItem[]): LookupOption[] => transformIdLabel(items)
);
