import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  WarehouseInventorySummary,
  WarehouseInventorySummaryResponse,
} from './warehouseInventoryTypes.ts';
import { fetchWarehouseInventorySummaryThunk } from './warehouseInventoryThunks.ts';

interface WarehouseInventoryState {
  data: WarehouseInventorySummary[];
  pagination: {
    page: number;
    limit: number;
    totalRecords: number;
    totalPages: number;
  };
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseInventoryState = {
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

const warehouseInventorySlice = createSlice({
  name: 'warehouseInventorySummary',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseInventorySummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseInventorySummaryThunk.fulfilled,
        (state, action: PayloadAction<WarehouseInventorySummaryResponse>) => {
          state.loading = false;
          state.data = action.payload.formattedSummary;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(
        fetchWarehouseInventorySummaryThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload || 'Unknown error occurred';
        }
      );
  },
});

export default warehouseInventorySlice.reducer;
