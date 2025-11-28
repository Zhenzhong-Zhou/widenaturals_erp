import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '../utils/lookupSelectorUtils';
import type {
  StatusLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

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
 * Maps Status lookup items to LookupOption[].
 *
 * Status items provide:
 * - `isActive`
 */
export const selectStatusLookupOptions = createSelector(
  [selectStatusLookupItems],
  (items: StatusLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
