import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import type { OrderTypeListItem } from './orderTypeTypes';

/**
 * Root selector for the paginated order types slice.
 */
const selectOrderTypesState = (state: RootState) => state.paginatedOrderTypes;

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
