import { createSlice } from '@reduxjs/toolkit';
import type {
  FlattenedInventoryAllocationSummary,
  PaginatedInventoryAllocationState,
} from '@features/inventoryAllocation/state/inventoryAllocationTypes';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchPaginatedInventoryAllocationsThunk } from '@features/inventoryAllocation/state';

const initialState: PaginatedInventoryAllocationState = {
  ...createInitialPaginatedState<FlattenedInventoryAllocationSummary>(),
};

const paginatedInventoryAllocations = createSlice({
  name: 'paginatedInventoryAllocations',
  initialState,
  reducers: {
    resetPaginatedInventoryAllocations: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedInventoryAllocationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPaginatedInventoryAllocationsThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(
        fetchPaginatedInventoryAllocationsThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error =
            action.payload?.message ||
            action.error.message ||
            'Failed to fetch inventory allocations';
        }
      );
  },
});

export const { resetPaginatedInventoryAllocations } =
  paginatedInventoryAllocations.actions;
export default paginatedInventoryAllocations.reducer;
