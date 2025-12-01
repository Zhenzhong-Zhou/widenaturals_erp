import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';

/**
 * Base selector for the Status lookup slice.
 */
export const selectStatusLookupState = (state: RootState) =>
  state.statusLookup;

/**
 * Retrieves Status lookup items.
 */
export const selectStatusLookupItems = createSelector(
  [selectStatusLookupState],
  (state) => state.data
);

/**
 * Loading state.
 */
export const selectStatusLookupLoading = createSelector(
  [selectStatusLookupState],
  (state) => state.loading
);

/**
 * Error state.
 */
export const selectStatusLookupError = createSelector(
  [selectStatusLookupState],
  (state) => state.error
);

/**
 * Pagination metadata (limit, offset, hasMore).
 */
export const selectStatusLookupMeta = createLookupMetaSelector(
  selectStatusLookupState
);

/**
 * Selector: maps raw Status lookup rows into an array of `StatusLookupOption`.
 *
 * This transforms raw lookup entities into standardized dropdown-ready
 * `LookupOption` objects while preserving the `isActive` flag.
 *
 * Returned structure per item:
 * {
 *   label: string;      // display name
 *   value: string;      // ID
 *   isActive: boolean;  // business-level active flag
 * }
 *
 * Used by:
 * - <StatusDropdown />
 * - any paginated status lookup UI
 */
export const selectStatusLookupOptions = createSelector(
  [selectStatusLookupItems],
  (items) => mapLookupItems(items, ['isActive'])
);
