import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchPaginatedInventoryAllocationsThunk } from './inventoryAllocationThunks';
import type {
  InventoryAllocationListState,
  FlattenedInventoryAllocationSummary,
  PaginatedInventoryAllocationListUiResponse,
} from './inventoryAllocationTypes';

const initialState: InventoryAllocationListState =
  createInitialPaginatedState<FlattenedInventoryAllocationSummary>(25);

const paginatedInventoryAllocationSlice = createSlice({
  name: 'paginatedInventoryAllocation',
  initialState,
  reducers: {
    resetPaginatedInventoryAllocation: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedInventoryAllocationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPaginatedInventoryAllocationsThunk.fulfilled,
        (state, action: PayloadAction<PaginatedInventoryAllocationListUiResponse>) => {
          const payload = action.payload;
          
          state.loading = false;
          state.data = payload.data;
          
          state.pagination = {
            page: payload.pagination.page,
            limit: payload.pagination.limit,
            totalRecords: payload.pagination.totalRecords,
            totalPages: payload.pagination.totalPages,
          };
        }
      )
      .addCase(fetchPaginatedInventoryAllocationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch inventory allocations.';
      });
  },
});

export const { resetPaginatedInventoryAllocation } =
  paginatedInventoryAllocationSlice.actions;

export default paginatedInventoryAllocationSlice.reducer;
