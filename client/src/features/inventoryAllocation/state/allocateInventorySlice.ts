import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  type InventoryAllocationResponse,
  postInventoryAllocationThunk,
} from '@features/inventoryAllocation';

interface AllocateInventoryState {
  loading: boolean;
  success: boolean;
  error: string | null;
  data: InventoryAllocationResponse | null;
}

const initialState: AllocateInventoryState = {
  loading: false,
  success: false,
  error: null,
  data: null,
};

const allocateInventorySlice = createSlice({
  name: 'allocateInventory',
  initialState,
  reducers: {
    resetAllocateInventoryState: (state) => {
      state.loading = false;
      state.success = false;
      state.error = null;
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(postInventoryAllocationThunk.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(
        postInventoryAllocationThunk.fulfilled,
        (state, action: PayloadAction<InventoryAllocationResponse>) => {
          state.loading = false;
          state.success = true;
          state.data = action.payload;
        }
      )
      .addCase(postInventoryAllocationThunk.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error =
          (action.payload as string) || 'Failed to allocate inventory.';
      });
  },
});

export const { resetAllocateInventoryState } = allocateInventorySlice.actions;
export default allocateInventorySlice.reducer;
