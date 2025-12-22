import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  ComplianceRecord,
  ComplianceRecordsState,
  PaginatedComplianceRecordResponse,
} from './complianceRecordTypes';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchComplianceRecordsThunk } from './complianceRecordThunks';

const initialState: ComplianceRecordsState = createInitialPaginatedState<ComplianceRecord>()

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
      .addCase(fetchComplianceRecordsThunk.fulfilled, (state, action: PayloadAction<PaginatedComplianceRecordResponse>) => {
        const { data, pagination } = action.payload;
        
        state.loading = false;
        state.data = data;
        state.pagination = pagination;
      })
      
      // --------------------------------------------------
      // Rejected
      // --------------------------------------------------
      .addCase(fetchComplianceRecordsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ??
          action.error.message ??
          'Failed to fetch compliance records';
      });
  },
});

export const { resetPaginatedComplianceRecords, } = paginatedComplianceRecordsSlice.actions;

export default paginatedComplianceRecordsSlice.reducer;
