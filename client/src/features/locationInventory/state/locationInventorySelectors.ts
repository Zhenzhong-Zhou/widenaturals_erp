import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the location inventory state slice.
 *
 * Responsibilities:
 * - Extract the location inventory state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - Internal implementation detail
 */
const selectLocationInventoryState = (state: RootState) =>
  selectRuntime(state).locationInventory;

/**
 * Selects the list of location inventory records.
 *
 * @returns Array of location inventory records.
 */
export const selectLocationInventoryRecords = createSelector(
  [selectLocationInventoryState],
  (state) => state.data
);

/**
 * Selects whether the location inventory request is currently loading.
 *
 * @returns `true` if data is being fetched.
 */
export const selectLocationInventoryLoading = createSelector(
  [selectLocationInventoryState],
  (state) => state.loading
);

/**
 * Selects any error message from the location inventory request.
 *
 * @returns Error message if the request failed, otherwise `null`.
 */
export const selectLocationInventoryError = createSelector(
  [selectLocationInventoryState],
  (state) => state.error
);

/**
 * Selects pagination metadata for location inventory.
 *
 * @returns Pagination information such as page, limit, and totalRecords,
 *          or `null` if pagination is not yet available.
 */
export const selectLocationInventoryPagination = createSelector(
  [selectLocationInventoryState],
  (state) => state.pagination
);
