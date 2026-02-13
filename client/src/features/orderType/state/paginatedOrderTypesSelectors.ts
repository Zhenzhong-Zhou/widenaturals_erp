import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';
import { FlattenedOrderTypeRecord } from '@features/orderType';

/**
 * Root selector for the paginated order types slice.
 */
const selectOrderTypesState = (state: RootState) =>
  selectRuntime(state).paginatedOrderTypes;

/**
 * Selector for the paginated order type records (UI-ready, flattened).
 */
export const selectOrderTypeList = createSelector(
  [selectOrderTypesState],
  (state): FlattenedOrderTypeRecord[] => state.data
);

/**
 * Selector for pagination metadata (page, limit, totalRecords, totalPages).
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
 * Selector indicating whether the order type list is empty.
 *
 * Returns `true` only when:
 * - loading has finished
 * - and there are zero records
 *
 * Intended strictly for UI empty-state messaging.
 */
export const selectOrderTypesIsEmpty = createSelector(
  [selectOrderTypeList, selectOrderTypesLoading],
  (data, loading) => !loading && data.length === 0
);
