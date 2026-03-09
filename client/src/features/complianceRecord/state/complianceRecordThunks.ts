import { createAsyncThunk } from '@reduxjs/toolkit';
import type {
  GetPaginatedComplianceRecordsParams,
  PaginatedComplianceListResponse,
} from '@features/complianceRecord/state';
import { complianceRecordService } from '@services/complianceRecordService';
import { flattenComplianceRecordsToRows } from '@features/complianceRecord/utils';
import type { UiErrorPayload } from '@utils/error/uiErrorUtils';
import { extractUiErrorPayload } from '@utils/error';

/**
 * Redux async thunk to fetch a paginated list of compliance records.
 *
 * Responsibilities:
 * - Delegates data fetching to the compliance service layer
 * - Applies canonical record flattening at the thunk boundary
 * - Preserves backend pagination metadata
 * - Ensures Redux stores only flattened, UI-ready rows
 *
 * Design Principles:
 * - Contains no domain/business logic
 * - Performs transformation only at the API boundary
 * - Maintains strict separation between service models and UI state
 *
 * Error Handling:
 * - Rejects with a structured {@link UiErrorPayload}
 * - All errors are normalized via `extractUiErrorPayload`
 * - Guarantees consistent UI-safe error handling across slices
 *
 * @param params - Pagination, sorting, and compliance filter options
 * @returns A fulfilled action containing {@link PaginatedComplianceListResponse}
 *          with flattened `data` rows.
 *
 * @example
 * dispatch(fetchComplianceRecordsThunk({
 *   page: 1,
 *   limit: 20,
 *   filters: { status: 'ACTIVE' }
 * }));
 */
export const fetchComplianceRecordsThunk = createAsyncThunk<
  PaginatedComplianceListResponse,
  GetPaginatedComplianceRecordsParams | undefined,
  { rejectValue: UiErrorPayload }
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
    } catch (error: unknown) {
      return rejectWithValue(extractUiErrorPayload(error));
    }
  }
);
