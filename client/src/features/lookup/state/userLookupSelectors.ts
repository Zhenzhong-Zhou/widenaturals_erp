import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  UserLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the User lookup slice.
 */
export const selectUserLookupState = (state: RootState) =>
  state.userLookup;

/**
 * Retrieves user lookup items.
 */
export const selectUserLookupItems = createSelector(
  [selectUserLookupState],
  (state) => state.data
);

/**
 * Loading state.
 */
export const selectUserLookupLoading = createSelector(
  [selectUserLookupState],
  (state) => state.loading
);

/**
 * Error state.
 */
export const selectUserLookupError = createSelector(
  [selectUserLookupState],
  (state) => state.error
);

/**
 * Pagination metadata (limit, offset, hasMore).
 */
export const selectUserLookupMeta = createLookupMetaSelector(
  selectUserLookupState
);

/**
 * Maps User lookup items to LookupOption[].
 *
 * Users support:
 * - isActive
 * - isValidToday
 * - subLabel (mapped by default if present)
 */
export const selectUserLookupOptions = createSelector(
  [selectUserLookupItems],
  (items: UserLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive', 'isValidToday'])
);
