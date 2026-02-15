import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@store/store';
import { selectRuntime } from '@store/selectors';

/**
 * Base selector for the paginated compliance records state slice.
 *
 * Responsibilities:
 * - Extract the paginated compliance records state from the Redux runtime tree
 *
 * Design notes:
 * - Plain function only (no `createSelector`)
 * - No memoization or transformation
 */
const selectPaginatedComplianceRecordsState = (state: RootState) =>
  selectRuntime(state).paginatedComplianceRecords;

/**
 * Selects the list of compliance records for the current page.
 */
export const selectPaginatedComplianceRecordsData = createSelector(
  [selectPaginatedComplianceRecordsState],
  (state) => state.data
);

/**
 * Selects whether the compliance records request is currently loading.
 */
export const selectPaginatedComplianceRecordsLoading = createSelector(
  [selectPaginatedComplianceRecordsState],
  (state) => state.loading
);

/**
 * Selects any error message from the compliance records state.
 */
export const selectPaginatedComplianceRecordsError = createSelector(
  [selectPaginatedComplianceRecordsState],
  (state) => state.error
);

/**
 * Selects pagination metadata for the compliance records list.
 */
export const selectPaginatedComplianceRecordsPagination = createSelector(
  [selectPaginatedComplianceRecordsState],
  (state) => state.pagination
);

/**
 * Returns true when the compliance records list is loaded and empty.
 */
export const selectPaginatedComplianceRecordsIsEmpty = createSelector(
  [
    selectPaginatedComplianceRecordsData,
    selectPaginatedComplianceRecordsLoading,
  ],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selects the total number of compliance records across all pages.
 *
 * Defaults to 0 when pagination metadata is unavailable.
 */
export const selectPaginatedComplianceRecordsTotalRecords = createSelector(
  [selectPaginatedComplianceRecordsPagination],
  (pagination) => pagination?.totalRecords ?? 0
);

/**
 * Selector factory that returns a memoized selector for retrieving
 * a single compliance record by its unique identifier.
 *
 * Behavior:
 * - Searches only within the currently loaded paginated records
 * - Does not trigger data fetching
 * - Returns `undefined` if the record is not present on the current page
 *
 * Performance notes:
 * - Memoized per `id` via selector-factory pattern
 * - Suitable for detail panels, drawers, and inline record views
 *
 * Usage considerations:
 * - Pagination limits lookup scope to the active page
 * - For cross-page access, use a normalized entity store or fetch-by-id API
 *
 * @param id Compliance record UUID
 * @returns Memoized selector resolving to the matching compliance record,
 *          or `undefined` if not found
 */
export const selectComplianceRecordById = (id: string) =>
  createSelector([selectPaginatedComplianceRecordsData], (records) =>
    records.find((r) => r.id === id)
  );
