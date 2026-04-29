import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createInitialPaginatedState } from '@store/pagination';
import { fetchInventoryActivityLogThunk } from './warehouseInventoryThunks';
import type {
  InventoryActivityLogListState,
  InventoryActivityLogRecord,
  PaginatedInventoryActivityLogListUiResponse,
} from './warehouseInventoryTypes';

const initialState: InventoryActivityLogListState =
  createInitialPaginatedState<InventoryActivityLogRecord>();

const inventoryActivityLogSlice = createSlice({
  name: 'inventoryActivityLog',
  initialState,
  reducers: {
    resetInventoryActivityLog: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventoryActivityLogThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInventoryActivityLogThunk.fulfilled,
        (state, action: PayloadAction<PaginatedInventoryActivityLogListUiResponse>) => {
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
      .addCase(fetchInventoryActivityLogThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as any)?.message ??
          action.error?.message ??
          'Failed to fetch inventory activity log.';
      });
  },
});

export const { resetInventoryActivityLog } =
  inventoryActivityLogSlice.actions;

export default inventoryActivityLogSlice.reducer;
