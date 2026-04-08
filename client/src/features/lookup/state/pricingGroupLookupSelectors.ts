import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  type PricingGroupLookupItem,
  type LookupOption,
} from '@features/lookup/state/lookupTypes';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';

/**
 * Root selector to access the `pricingGroupLookup` state slice from the Redux store.
 *
 * @param state - The global Redux store state.
 * @returns The `pricingGroupLookup` slice state.
 */
const selectPricingGroupLookupState = (state: RootState) =>
  selectRuntime(state).pricingGroupLookup;

/**
 * Selector to retrieve the full list of pricing group lookup items.
 *
 * @returns An array of {@link PricingGroupLookupItem} objects from the lookup state.
 */
export const selectPricingGroupLookupItems = createSelector(
  selectPricingGroupLookupState,
  (pricingGroupLookup) => pricingGroupLookup.data
);

/**
 * Selector to retrieve the loading status for the pricing group lookup request.
 *
 * @returns A boolean indicating if the pricing group lookup is currently loading.
 */
export const selectPricingGroupLookupLoading = createSelector(
  selectPricingGroupLookupState,
  (pricingGroupLookup) => pricingGroupLookup.loading
);

/**
 * Selector to retrieve the error message (if any) from the pricing group lookup state.
 *
 * @returns A string error message or null if no error occurred.
 */
export const selectPricingGroupLookupError = createSelector(
  selectPricingGroupLookupState,
  (state): string | null => state.error?.message ?? null
);

/**
 * Selector to retrieve pagination metadata for pricing group lookup.
 *
 * Returns offset, limit, and hasMore fields for pagination control.
 *
 * @returns An object with `{ offset, limit, hasMore }` values.
 */
export const selectPricingGroupLookupMeta = createLookupMetaSelector(
  selectPricingGroupLookupState
);

/**
 * Selector that maps pricing group lookup items into dropdown options.
 *
 * Each option includes:
 * - `label` and `value` for use in dropdown UI components (with `value` = pricing `id`)
 * - `isActive` flag to indicate if the pricing record is active
 * - `isValidToday` flag to indicate if the pricing is valid on the current date
 *
 * Suitable for use in Autocomplete, Select, and other dropdown components
 * that need to display pricing options with status and validity context.
 *
 * @returns An array of {@link LookupOption} objects enriched with status flags.
 */
export const selectPricingGroupLookupOptions = createSelector(
  selectPricingGroupLookupItems,
  (items: PricingGroupLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive', 'isValidToday'])
);
