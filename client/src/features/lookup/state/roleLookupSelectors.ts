import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import {
  createLookupMetaSelector,
  mapLookupItems,
} from '@features/lookup/utils/lookupSelectorUtils';
import type {
  RoleLookupItem,
  LookupOption,
} from '@features/lookup/state/lookupTypes';

/**
 * Base selector for the Role lookup slice.
 */
const selectRoleLookupState = (state: RootState) =>
  selectRuntime(state).roleLookup;

/**
 * Retrieves role lookup items.
 */
export const selectRoleLookupItems = createSelector(
  [selectRoleLookupState],
  (state) => state.data
);

/**
 * Loading state.
 */
export const selectRoleLookupLoading = createSelector(
  [selectRoleLookupState],
  (state) => state.loading
);

/**
 * Error state.
 */
export const selectRoleLookupError = createSelector(
  [selectRoleLookupState],
  (state) => state.error
);

/**
 * Pagination metadata (limit, offset, hasMore).
 */
export const selectRoleLookupMeta = createLookupMetaSelector(
  selectRoleLookupState
);

/**
 * Maps Role lookup items to LookupOption[].
 *
 * Roles support:
 * - isActive
 *
 * NOTE:
 * Roles intentionally do NOT expose subLabel or date-based flags.
 */
export const selectRoleLookupOptions = createSelector(
  [selectRoleLookupItems],
  (items: RoleLookupItem[]): LookupOption[] =>
    mapLookupItems(items, ['isActive'])
);
