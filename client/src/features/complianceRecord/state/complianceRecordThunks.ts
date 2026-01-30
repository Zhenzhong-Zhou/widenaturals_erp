import { createAsyncThunk } from '@reduxjs/toolkit';
import {
  GetPaginatedComplianceRecordsParams,
  PaginatedComplianceListResponse,
} from '@features/complianceRecord/state';
import { complianceRecordService } from '@services/complianceRecordService';
import { flattenComplianceRecordsToRows } from '@features/complianceRecord/utils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Fetch a paginated list of compliance records.
 *
 * Responsibilities:
 * - Delegates data fetching to the compliance service layer
 * - Applies canonical compliance list flattening at the thunk boundary
 * - Preserves backend pagination metadata without transformation
 * - Normalizes API errors into a UI-safe payload
 *
 * Design notes:
 * - Thunk intentionally contains no domain logic
 * - Returned records are flattened and UI-ready
 *
 * @param params - Pagination, sorting, and compliance filter options
 * @returns Paginated, flattened compliance records
 */
export const fetchComplianceRecordsThunk = createAsyncThunk<
  PaginatedComplianceListResponse,
  GetPaginatedComplianceRecordsParams | undefined,
  { rejectValue: { message: string; traceId?: string } }
>(
  'compliance/fetchPaginatedRecords',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response =
        await complianceRecordService.fetchPaginatedComplianceRecords(params);
      
      return {
        ...response,
        data: flattenComplianceRecordsToRows(response.data),
      };
    } catch (error) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
