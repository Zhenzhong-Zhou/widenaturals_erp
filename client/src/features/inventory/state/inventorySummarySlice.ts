import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { InventorySummary, InventorySummaryPagination, InventorySummaryResponse } from './inventoryTypes.ts';
import { fetchInventorySummaryThunk } from './inventoryThunks.ts';

interface InventorySummaryState {
  data: InventorySummary[];
  pagination: InventorySummaryPagination;
  loading: boolean;
  error: string | null;
}

const initialState: InventorySummaryState = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 1,
  },
  loading: false,
  error: null,
};

const inventorySummarySlice = createSlice({
  name: 'inventorySummary',
  initialState,
  reducers: {
    resetInventorySummary: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventorySummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInventorySummaryThunk.fulfilled,
        (state, action: PayloadAction<InventorySummaryResponse>) => {
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
          state.loading = false;
        }
      )
      .addCase(
        fetchInventorySummaryThunk.rejected,
        (state, action: PayloadAction<string | undefined>) => {
          state.loading = false;
          state.error =
            action.payload || 'Failed to fetch inventory summary';
        }
      );
  },
});

export const { resetInventorySummary } = inventorySummarySlice.actions;
export default inventorySummarySlice.reducer;
