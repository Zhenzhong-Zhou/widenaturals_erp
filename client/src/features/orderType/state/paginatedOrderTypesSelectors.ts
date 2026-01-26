import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import type { OrderTypeListItem } from './orderTypeTypes';

/**
 * Root selector for the paginated order types slice.
 */
const selectOrderTypesState = (state: RootState) =>
  selectRuntime(state).paginatedOrderTypes;

/**
 * Selector for the paginated order types data.
 */
export const selectOrderTypeList = createSelector(
  [selectOrderTypesState],
  (state): OrderTypeListItem[] => state.data
);

/**
 * Selector for the pagination metadata (page, limit, totalRecords, etc).
 */
export const selectOrderTypePagination = createSelector(
  [selectOrderTypesState],
  (state) => state.pagination
);

/**
 * Selector for loading state.
 */
export const selectOrderTypesLoading = createSelector(
  [selectOrderTypesState],
  (state) => state.loading
);

/**
 * Selector for error message.
 */
export const selectOrderTypesError = createSelector(
  [selectOrderTypesState],
  (state) => state.error
);

/**
 * Selector indicating whether the Order Type list is empty.
 *
 * Returns `true` only when:
 * - loading has finished
 * - and there are zero order type records
 *
 * This selector is intended for UI empty-state messaging only.
 * It should NOT be used to conditionally unmount tables.
 */
export const selectOrderTypesIsEmpty = createSelector(
  [
    selectOrderTypeList,
    selectOrderTypesLoading,
  ],
  (data, loading) => !loading && data.length === 0
);
