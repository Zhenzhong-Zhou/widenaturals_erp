import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  createLookupMetaSelector,
  mapLookupItems,
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
 * Selector that maps tax rate lookup items into dropdown options.
 *
 * Each option includes:
 * - `label` (from the tax rate name) and `value` (the tax rate `id`)
 * - `isActive` flag to indicate whether the tax rate is currently active
 * - `isValidToday` flag to indicate whether the tax rate is valid on the current date
 *
 * Suitable for use in Autocomplete, Select, and other dropdown components
 * where tax rate choices are required.
 *
 * @returns An array of {@link LookupOption} objects enriched with status flags.
 */
export const selectTaxRateDropdownOptions = createSelector(
  [selectTaxRateLookupItems],
  (items: TaxRateLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive', 'isValidToday'])
);
