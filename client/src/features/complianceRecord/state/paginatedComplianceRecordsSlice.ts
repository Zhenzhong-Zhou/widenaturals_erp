import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  ComplianceRecordsState,
  ComplianceRecordTableRow,
  PaginatedComplianceListResponse,
} from './complianceRecordTypes';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchComplianceRecordsThunk } from '@features/complianceRecord';

const initialState: ComplianceRecordsState =
  createInitialPaginatedState<ComplianceRecordTableRow>();

const paginatedComplianceRecordsSlice = createSlice({
  name: 'paginatedComplianceRecords',
  initialState,
  reducers: {
    /**
     * Reset compliance list state (used on unmount or filter reset).
     */
    resetPaginatedComplianceRecords: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      // --------------------------------------------------
      // Pending
      // --------------------------------------------------
      .addCase(fetchComplianceRecordsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      // --------------------------------------------------
      // Fulfilled
      // --------------------------------------------------
      .addCase(
        fetchComplianceRecordsThunk.fulfilled,
        (state, action: PayloadAction<PaginatedComplianceListResponse>) => {
          const { data, pagination } = action.payload;

          state.loading = false;
          state.data = data; // ComplianceRecordTableRow[]
          state.pagination = pagination;
        }
      )

      // --------------------------------------------------
      // Rejected
      // --------------------------------------------------
      .addCase(fetchComplianceRecordsThunk.rejected, (state, action) => {
        state.loading = false;

        state.error =
          action.payload?.message ||
          action.error.message ||
          'Failed to fetch compliance records';
      });
  },
});

export const { resetPaginatedComplianceRecords } =
  paginatedComplianceRecordsSlice.actions;

export default paginatedComplianceRecordsSlice.reducer;
