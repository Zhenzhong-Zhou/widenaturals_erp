import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * selectPaginatedUsersState
 *
 * Base selector for the paginated users slice.
 *
 * Responsibilities:
 * - Extract the `paginatedUsers` state from runtime
 *
 * Design notes:
 * - MUST be a plain function
 * - MUST NOT use `createSelector`
 * - This avoids identity-selector warnings
 *
 * @param state Root redux state
 */
const selectPaginatedUsersState = (state: RootState) =>
  selectRuntime(state).paginatedUsers;

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
