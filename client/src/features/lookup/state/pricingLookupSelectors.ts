import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';
import {
  type PricingLookupItem,
  type LookupOption,
} from '@features/lookup/state/lookupTypes';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';

/**
 * Root selector to access the `pricingLookup` state slice from the Redux store.
 *
 * @param state - The global Redux store state.
 * @returns The `pricingLookup` slice state.
 */
const selectPricingLookupState= createSelector(
  [selectRuntime],
  (runtime) => runtime.pricingLookup
);

/**
 * Selector to retrieve the full list of pricing lookup items.
 *
 * @returns An array of {@link PricingLookupItem} objects from the lookup state.
 */
export const selectPricingLookupItems = createSelector(
  selectPricingLookupState,
  (pricingLookup) => pricingLookup.data
);

/**
 * Selector to retrieve the loading status for the pricing lookup request.
 *
 * @returns A boolean indicating if the pricing lookup is currently loading.
 */
export const selectPricingLookupLoading = createSelector(
  selectPricingLookupState,
  (pricingLookup) => pricingLookup.loading
);

/**
 * Selector to retrieve the error message (if any) from the pricing lookup state.
 *
 * @returns A string error message or null if no error occurred.
 */
export const selectPricingLookupError = createSelector(
  selectPricingLookupState,
  (pricingLookup) => pricingLookup.error
);

/**
 * Selector to retrieve pagination metadata for pricing lookup.
 *
 * Returns offset, limit, and hasMore fields for pagination control.
 *
 * @returns An object with `{ offset, limit, hasMore }` values.
 */
export const selectPricingLookupMeta = createLookupMetaSelector(
  selectPricingLookupState
);

/**
 * Selector that maps pricing lookup items into dropdown options.
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
export const selectPricingLookupOptions = createSelector(
  selectPricingLookupItems,
  (items: PricingLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive', 'isValidToday'])
);
