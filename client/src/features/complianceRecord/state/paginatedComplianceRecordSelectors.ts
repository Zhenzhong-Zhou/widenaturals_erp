import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '@store/store';
import { ComplianceRecord } from '@features/complianceRecord/state';

/**
 * Base selector for the paginated compliance records slice.
 * Extracts the entire `complianceRecords` state from the Redux store.
 */
export const selectPaginatedComplianceRecordsState = (state: RootState) =>
  state.complianceRecords;

/**
 * Selector: Returns the array of compliance records.
 * Memoized using `createSelector`.
 */
export const selectPaginatedComplianceRecordsData = createSelector(
  [selectPaginatedComplianceRecordsState],
  (state) => state.data
);

/**
 * Selector: Indicates whether the compliance records request is currently loading.
 */
export const selectPaginatedComplianceRecordsLoading = createSelector(
  [selectPaginatedComplianceRecordsState],
  (state) => state.loading
);

/**
 * Selector: Returns the error message from the compliance records state, if any.
 */
export const selectPaginatedComplianceRecordsError = createSelector(
  [selectPaginatedComplianceRecordsState],
  (state) => state.error
);

/**
 * Selector: Returns the pagination metadata for compliance records.
 */
export const selectPaginatedComplianceRecordsPagination = createSelector(
  [selectPaginatedComplianceRecordsState],
  (state) => state.pagination
);

/**
 * Selector: Returns `true` only if the compliance records list is loaded and empty.
 */
export const selectPaginatedComplianceRecordsIsEmpty = createSelector(
  [
    selectPaginatedComplianceRecordsData,
    selectPaginatedComplianceRecordsLoading,
  ],
  (data, loading) => !loading && data.length === 0
);

/**
 * Selector: Returns the total number of compliance records across all pages.
 */
export const selectPaginatedComplianceRecordsTotalRecords = createSelector(
  [selectPaginatedComplianceRecordsPagination],
  (pagination) => pagination.totalRecords
);

/**
 * Selector factory: Returns a memoized selector that retrieves
 * a single compliance record by its unique identifier.
 *
 * Behavior:
 * - Searches only within the currently loaded paginated records
 * - Does NOT trigger data fetching
 * - Returns `undefined` if the record is not present in the current page
 *
 * Performance notes:
 * - Memoized per `id` via selector factory pattern
 * - Safe to use in components rendering detail panels or drawers
 *
 * Usage considerations:
 * - If records are paginated, this selector will only find records
 *   from the active page
 * - For guaranteed access across pages, a dedicated entity store
 *   or fetch-by-id endpoint should be used
 *
 * @param id - Compliance record UUID
 * @returns A memoized selector resolving to the matching compliance record,
 *          or `undefined` if not found
 *
 * @example
 * const record = useSelector(selectComplianceRecordById(recordId));
 */
export const selectComplianceRecordById = (id: string) =>
  createSelector(
    [selectPaginatedComplianceRecordsData],
    (records) => records.find((r: ComplianceRecord) => r.id === id)
  );
