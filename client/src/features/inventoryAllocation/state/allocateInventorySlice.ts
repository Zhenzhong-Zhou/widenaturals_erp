import { createSlice } from '@reduxjs/toolkit';
import type { AllocateInventoryState } from './inventoryAllocationTypes';
import { allocateInventoryThunk } from '@features/inventoryAllocation/state/inventoryAllocationThunks';

const initialState: AllocateInventoryState = {
  loading: false,
  data: null,
  error: null,
};

const allocateInventorySlice = createSlice({
  name: 'allocateInventory',
  initialState,
  reducers: {
    resetAllocationState: (state) => {
      state.loading = false;
      state.data = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(allocateInventoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(allocateInventoryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data; // response = { success, message, data }
        state.error = null;
      })
      .addCase(allocateInventoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || 'Allocation failed';
      });
  },
});

export const { resetAllocationState } = allocateInventorySlice.actions;

export default allocateInventorySlice.reducer;
