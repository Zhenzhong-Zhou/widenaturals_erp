import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  GetPaginatedComplianceRecordsParams,
  PaginatedComplianceRecordResponse,
} from '@features/complianceRecord/state';
import { complianceRecordService } from '@services/complianceRecordService';

/**
 * Fetch a paginated list of compliance records.
 *
 * This thunk is a thin Redux wrapper around
 * {@link complianceRecordService.fetchPaginatedComplianceRecords}.
 *
 * Responsibilities:
 * - Orchestrates async request lifecycle (pending / fulfilled / rejected)
 * - Propagates typed API responses into Redux state
 * - Normalizes error handling via `rejectWithValue`
 *
 * Design notes:
 * - Business logic and query construction live in the service layer
 * - Thunk contains no domain logic by design
 * - Filters (including nested dateRanges) are passed through unchanged
 *
 * Expected API behavior:
 * - Returns {@link PaginatedComplianceRecordResponse} on success
 * - Throws on transport or server errors
 *
 * Error handling:
 * - If backend provides a structured error message → surfaced to Redux
 * - Otherwise falls back to a generic failure message
 *
 * @param params - Pagination, sorting, and compliance filter options
 * @returns A fulfilled action containing paginated compliance records
 *
 * @example
 * dispatch(fetchComplianceRecordsThunk({
 *   page: 1,
 *   limit: 20,
 *   sortBy: 'cr.created_at',
 *   sortOrder: 'DESC',
 *   filters: {
 *     type: 'NPN',
 *     keyword: '8010',
 *     dateRanges: {
 *       issued: {
 *         from: '2025-01-01',
 *         to: '2025-12-31',
 *       },
 *     },
 *   },
 * }));
 */
export const fetchComplianceRecordsThunk = createAsyncThunk<
  PaginatedComplianceRecordResponse,
  GetPaginatedComplianceRecordsParams | undefined
>(
  'compliance/fetchPaginatedRecords',
  async (params = {}, { rejectWithValue }) => {
    try {
      return await complianceRecordService.fetchPaginatedComplianceRecords(
        params
      );
    } catch (error: any) {
      return rejectWithValue(
        error?.response?.data?.message ??
          error?.message ??
          'Failed to fetch compliance records'
      );
    }
  }
);
