import { createSlice } from '@reduxjs/toolkit';
import { fetchWarehouseInventoryRecordsThunk } from './warehouseInventoryThunks';
import type {
  WarehouseInventoryRecord,
  WarehouseInventoryState,
} from './warehouseInventoryTypes';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';
import { createInitialPaginatedState } from '@store/pagination';

const initialState: WarehouseInventoryState =
  createInitialPaginatedState<WarehouseInventoryRecord>();

const warehouseInventorySlice = createSlice({
  name: 'warehouseInventory',
  initialState,
  reducers: {
    resetWarehouseInventory: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseInventoryRecordsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseInventoryRecordsThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(
        fetchWarehouseInventoryRecordsThunk.rejected,
        (state, action) => {
          applyRejected(
            state,
            action,
            'Failed to fetch warehouse inventory records.'
          );
        }
      );
  },
});

export const { resetWarehouseInventory } = warehouseInventorySlice.actions;
export default warehouseInventorySlice.reducer;
