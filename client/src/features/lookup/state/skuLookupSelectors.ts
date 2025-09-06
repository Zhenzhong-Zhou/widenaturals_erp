import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { type LookupOption, type SkuLookupItem } from '@features/lookup/state/lookupTypes';
import { createLookupMetaSelector, mapLookupItems } from '../utils/lookupSelectorUtils';

/**
 * Root selector to access the `skuLookup` state slice from the Redux store.
 *
 * @param state - The global Redux store state.
 * @returns The `skuLookup` slice state.
 */
export const selectSkuLookupState = (state: RootState) => state.skuLookup;

/**
 * Selector to retrieve the full list of SKU lookup items.
 *
 * @returns An array of {@link SkuLookupItem} objects from the lookup state.
 */
export const selectSkuLookupItems = createSelector(
  selectSkuLookupState,
  (skuLookup) => skuLookup.data
);

/**
 * Selector to retrieve the loading status for the SKU lookup request.
 *
 * @returns A boolean indicating if the SKU lookup is currently loading.
 */
export const selectSkuLookupLoading = createSelector(
  selectSkuLookupState,
  (skuLookup) => skuLookup.loading
);

/**
 * Selector to retrieve the error message (if any) from the SKU lookup state.
 *
 * @returns A string error message or null if no error occurred.
 */
export const selectSkuLookupError = createSelector(
  selectSkuLookupState,
  (skuLookup) => skuLookup.error
);

/**
 * Selector to retrieve pagination metadata for SKU lookup.
 *
 * Returns offset, limit, and hasMore fields for pagination control.
 *
 * @returns An object with `{ offset, limit, hasMore }` values.
 */
export const selectSkuLookupMeta = createLookupMetaSelector(selectSkuLookupState);

/**
 * Selector to retrieve and transform only *abnormal* SKU lookup items for dropdown use.
 *
 * Filters the SKU lookup data to include only records where `isNormal === false`,
 * and maps each item to a `{ label, value, isNormal, issueReasons }` format.
 * This is typically used for diagnostics, warnings, or flagging problematic SKUs in the UI.
 *
 * @returns An array of enriched {@link LookupOption} objects with diagnostic context.
 */
export const selectAbnormalSkuLookupOptions = createSelector(
  selectSkuLookupItems,
  (items: SkuLookupItem[]): LookupOption[] =>
    mapLookupItems(
      items.filter((item) => item.isNormal === false),
      ['isNormal', 'issueReasons']
    )
);

/**
 * Selector to retrieve and transform only *normal* SKU lookup items for dropdown use.
 *
 * Filters the SKU lookup data to include records where `isNormal !== false`,
 * and maps each item to a `{ label, value, isNormal }` format.
 * This is used for default or healthy SKUs in dropdowns or selection components.
 *
 * Note: `undefined` or missing `isNormal` values are treated as normal.
 *
 * @returns An array of enriched {@link LookupOption} objects for normal SKUs.
 */
export const selectNormalSkuLookupOptions = createSelector(
  selectSkuLookupItems,
  (items: SkuLookupItem[]): LookupOption[] =>
    mapLookupItems(
      items.filter((item) => item.isNormal !== false),
      ['isNormal'] // Include only what’s needed for the consumer
    )
);
