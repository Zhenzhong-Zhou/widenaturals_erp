import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AvailableInventoryLot } from '@features/inventoryAllocation';
import { fetchAvailableInventoryLotsThunk } from '@features/inventoryAllocation/state/inventoryAllocationThunks.ts';

interface AvailableInventoryLotsState {
  lots: AvailableInventoryLot[];
  loading: boolean;
  error: string | null;
}

const initialState: AvailableInventoryLotsState = {
  lots: [],
  loading: false,
  error: null,
};

const availableInventoryLotsSlice = createSlice({
  name: 'availableInventoryLots',
  initialState,
  reducers: {
    clearAvailableInventoryLots: (state) => {
      state.lots = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAvailableInventoryLotsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAvailableInventoryLotsThunk.fulfilled,
        (state, action: PayloadAction<AvailableInventoryLot[]>) => {
          state.loading = false;
          state.lots = action.payload;
        }
      )
      .addCase(fetchAvailableInventoryLotsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAvailableInventoryLots } =
  availableInventoryLotsSlice.actions;
export default availableInventoryLotsSlice.reducer;
