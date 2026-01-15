import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  UserLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

/**
 * selectUserLookupState
 *
 * Base selector for the user lookup slice.
 *
 * Responsibilities:
 * - Extract the `userLookup` state from runtime
 *
 * Design notes:
 * - MUST be a plain function
 * - MUST NOT use `createSelector`
 * - Avoids identity-selector warnings
 *
 * @param state Root redux state
 */
const selectUserLookupState = (state: RootState) =>
  selectRuntime(state).userLookup;

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
    mapLookupItems(items, ['isActive', 'subLabel'])
);
