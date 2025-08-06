import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  type PricingLookupItem,
  type LookupOption,
} from '@features/lookup/state/lookupTypes';
import { createLookupMetaSelector, mapLookupItems } from '../utils/lookupSelectorUtils';

/**
 * Root selector to access the `pricingLookup` state slice from the Redux store.
 *
 * @param state - The global Redux store state.
 * @returns The `pricingLookup` slice state.
 */
export const selectPricingLookupState = (state: RootState) => state.pricingLookup;

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
export const selectPricingLookupMeta = createLookupMetaSelector(selectPricingLookupState);

/**
 * Selector to map all pricing lookup items into generic dropdown options.
 *
 * Maps each pricing item into a `{ label, value }` format for use in UI components.
 * This does not filter based on validity or status — all items are included.
 *
 * @returns An array of {@link LookupOption} objects representing pricing options.
 */
export const selectPricingLookupOptions = createSelector(
  selectPricingLookupItems,
  (items: PricingLookupItem[]): LookupOption[] =>
    mapLookupItems(items) // Maps to { label, value } by default
);
