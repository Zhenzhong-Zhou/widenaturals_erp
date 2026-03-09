import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  InventoryAllocationConfirmationResponse,
  InventoryAllocationConfirmationState,
} from '@features/inventoryAllocation/state';
import { confirmInventoryAllocationThunk } from './inventoryAllocationThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: InventoryAllocationConfirmationState = {
  data: null,
  loading: false,
  error: null,
};

export const inventoryAllocationConfirmationSlice = createSlice({
  name: 'inventoryAllocationConfirmation',
  initialState,
  reducers: {
    resetInventoryAllocationConfirmation: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(confirmInventoryAllocationThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        confirmInventoryAllocationThunk.fulfilled,
        (
          state,
          action: PayloadAction<InventoryAllocationConfirmationResponse>
        ) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(confirmInventoryAllocationThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to confirm allocation');
      });
  },
});

export const { resetInventoryAllocationConfirmation } =
  inventoryAllocationConfirmationSlice.actions;
export default inventoryAllocationConfirmationSlice.reducer;
