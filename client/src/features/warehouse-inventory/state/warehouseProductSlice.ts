import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WarehouseProductSummary, Pagination, WarehouseProductSummaryResponse } from './warehouseInventoryTypes.ts';
import { fetchWarehouseProductSummaryThunk } from './warehouseInventoryThunks.ts';

interface WarehouseProductState {
  productSummaryData: WarehouseProductSummary[];
  pagination: Pagination;
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseProductState = {
  productSummaryData: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 0 },
  loading: false,
  error: null,
};

const warehouseProductSlice = createSlice({
  name: 'warehouseProducts',
  initialState,
  reducers: {
    resetWarehouseProductSummary: (state) => {
      state.productSummaryData = [];
      state.pagination = { page: 1, limit: 10, totalRecords: 0, totalPages: 0 };
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseProductSummaryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarehouseProductSummaryThunk.fulfilled, (state, action: PayloadAction<WarehouseProductSummaryResponse>) => {
        state.loading = false;
        state.productSummaryData = action.payload.productSummaryData;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchWarehouseProductSummaryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetWarehouseProductSummary } = warehouseProductSlice.actions;
export default warehouseProductSlice.reducer;
