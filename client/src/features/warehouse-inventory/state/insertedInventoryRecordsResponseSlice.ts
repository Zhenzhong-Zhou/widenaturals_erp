import { createSlice } from '@reduxjs/toolkit';
import { fetchInsertedInventoryRecordsThunk, WarehouseInventoryInsertResponse } from '@features/warehouse-inventory';

interface InsertedInventoryState {
  data: WarehouseInventoryInsertResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: InsertedInventoryState = {
  data: null,
  loading: false,
  error: null,
};

const insertedInventorySlice = createSlice({
  name: 'insertedInventoryRecordsResponse',
  initialState,
  reducers: {
    resetInsertedInventory: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInsertedInventoryRecordsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchInsertedInventoryRecordsThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(fetchInsertedInventoryRecordsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong.';
      });
  },
});

export const { resetInsertedInventory } = insertedInventorySlice.actions;
export default insertedInventorySlice.reducer;
