import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';
import type {
  SkuCodeBaseLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the SKU Code Base lookup slice.
 */
const selectSkuCodeBaseLookupState = createSelector(
  [selectRuntime],
  (runtime) => runtime.skuCodeBaseLookup
);

/**
 * Selector for retrieving raw SKU Code Base lookup items.
 * These include brand_code and category_code.
 */
export const selectSkuCodeBaseLookupItems = createSelector(
  [selectSkuCodeBaseLookupState],
  (state) => state.data
);

/**
 * Selector for loading state.
 */
export const selectSkuCodeBaseLookupLoading = createSelector(
  [selectSkuCodeBaseLookupState],
  (state) => state.loading
);

/**
 * Selector for error state.
 */
export const selectSkuCodeBaseLookupError = createSelector(
  [selectSkuCodeBaseLookupState],
  (state) => state.error
);

/**
 * Pagination metadata selector (limit, offset, hasMore).
 */
export const selectSkuCodeBaseLookupMeta = createLookupMetaSelector(
  selectSkuCodeBaseLookupState
);

/**
 * Maps SKU Code Base items to dropdown-friendly LookupOption[].
 * Includes isActive flag for UI rendering.
 */
export const selectSkuCodeBaseLookupOptions = createSelector(
  [selectSkuCodeBaseLookupItems],
  (items: SkuCodeBaseLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);

/**
 * Selector: Returns a shallow-cloned array of the raw SKU Code Base lookup items.
 *
 * Purpose:
 * - Prevents accidental mutation of the Redux store by returning a new array (`[...]`)
 * - Useful when components or utilities need the raw items for:
 *   - Label parsing
 *   - Code extraction (brand/category)
 *   - Building dropdown options
 *   - Caching or pre-processing
 *
 * Behavior:
 * - Input: `selectSkuCodeBaseLookupItems` (memoized selector of SkuCodeBaseLookupItem[])
 * - Output: A new array containing the same items.
 *
 * Notes:
 * - Shallow copy only; objects inside the array remain the same.
 * - Still memoized because the upstream selector only changes when items actually change.
 *
 * @returns SkuCodeBaseLookupItem[] A new array containing the lookup items.
 */
export const selectSkuCodeBaseLookupRawItems = createSelector(
  [selectSkuCodeBaseLookupItems],
  (items: SkuCodeBaseLookupItem[]) => [...items]
);
