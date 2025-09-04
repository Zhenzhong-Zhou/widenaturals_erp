import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  InventoryAllocationResponse,
  PaginatedInventoryAllocationState,
} from '@features/inventoryAllocation/state/inventoryAllocationTypes';
import { fetchPaginatedInventoryAllocationsThunk } from '@features/inventoryAllocation/state/inventoryAllocationThunks';

const initialState: PaginatedInventoryAllocationState = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalPages: 0,
    totalRecords: 0,
  },
  loading: false,
  error: null,
};

const paginatedInventoryAllocations = createSlice({
  name: 'paginatedInventoryAllocations',
  initialState,
  reducers: {
    resetInventoryAllocationsState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedInventoryAllocationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPaginatedInventoryAllocationsThunk.fulfilled,
        (state, action: PayloadAction<InventoryAllocationResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchPaginatedInventoryAllocationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error?.message || 'Failed to fetch inventory allocations';
      });
  },
});

export const { resetInventoryAllocationsState } = paginatedInventoryAllocations.actions;
export default paginatedInventoryAllocations.reducer;
