import { createSlice } from '@reduxjs/toolkit';
import { fetchWarehouseInventorySummaryByItemIdThunk } from './warehouseInventoryThunks';
import type {
  WarehouseInventorySummaryDetailState,
  WarehouseInventorySummaryItemDetails,
} from '@features/warehouseInventory/state/warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';
import { createInitialPaginatedState } from '@store/pagination';

const initialState: WarehouseInventorySummaryDetailState =
  createInitialPaginatedState<WarehouseInventorySummaryItemDetails>();

const warehouseInventorySummaryDetailSlice = createSlice({
  name: 'warehouseInventorySummaryDetail',
  initialState,
  reducers: {
    resetWarehouseInventorySummaryDetail: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseInventorySummaryByItemIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseInventorySummaryByItemIdThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(
        fetchWarehouseInventorySummaryByItemIdThunk.rejected,
        (state, action) => {
          applyRejected(
            state,
            action,
            'Failed to fetch warehouse inventory summary.'
          );
        }
      );
  },
});

export const { resetWarehouseInventorySummaryDetail } =
  warehouseInventorySummaryDetailSlice.actions;

export default warehouseInventorySummaryDetailSlice.reducer;
