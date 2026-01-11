import { createSelector } from '@reduxjs/toolkit';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the paginated users slice.
 * Extracts the entire `paginatedUsers` state from the Redux store.
 */
export const selectPaginatedUsersState= createSelector(
  [selectRuntime],
  (runtime) => runtime.paginatedUsers
);

/**
 * Selector: Returns the array of user records.
 *
 * Depending on the current query, the data may contain
 * `UserCardView[]` or `UserListView[]`.
 */
export const selectPaginatedUsersData = createSelector(
  [selectPaginatedUsersState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the user list request is currently loading.
 */
export const selectPaginatedUsersLoading = createSelector(
  [selectPaginatedUsersState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the paginated users state, if any.
 */
export const selectPaginatedUsersError = createSelector(
  [selectPaginatedUsersState],
  (state) => state.error
);

/**
 * Selector: Returns the pagination metadata for the user list.
 */
export const selectPaginatedUsersPagination = createSelector(
  [selectPaginatedUsersState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` only if the user list is loaded and empty.
 */
export const selectPaginatedUsersIsEmpty = createSelector(
  [selectPaginatedUsersData, selectPaginatedUsersLoading],
  (data, loading) => !loading && data.length === 0
);
