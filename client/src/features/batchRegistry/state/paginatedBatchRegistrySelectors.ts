import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * selectPaginatedBatchRegistryState
 *
 * Base selector for the paginated batch registry slice.
 *
 * Responsibilities:
 * - Extract the `paginatedBatchRegistry` state from runtime
 *
 * Design notes:
 * - MUST be a plain function
 * - MUST NOT use `createSelector`
 * - This avoids identity-selector warnings
 *
 * @param state Root redux state
 */
const selectPaginatedBatchRegistryState = (state: RootState) =>
  selectRuntime(state).paginatedBatchRegistry;

/**
 * Selector: Returns the array of flattened, UI-ready
 * batch registry records.
 */
export const selectPaginatedBatchRegistryData = createSelector(
  [selectPaginatedBatchRegistryState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the batch registry request is currently loading.
 */
export const selectPaginatedBatchRegistryLoading = createSelector(
  [selectPaginatedBatchRegistryState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the batch registry state, if any.
 */
export const selectPaginatedBatchRegistryError = createSelector(
  [selectPaginatedBatchRegistryState],
  (state) => state.error
);

/**
 * Selector: Returns the pagination metadata for the batch registry list.
 */
export const selectPaginatedBatchRegistryPagination = createSelector(
  [selectPaginatedBatchRegistryState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` only if the batch registry list is loaded and empty.
 */
export const selectPaginatedBatchRegistryIsEmpty = createSelector(
  [
    selectPaginatedBatchRegistryData,
    selectPaginatedBatchRegistryLoading,
  ],
  (data, loading) => !loading && data.length === 0
);
