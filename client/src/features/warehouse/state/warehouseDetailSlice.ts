import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  fetchWarehouseDetailsThunk,
  type WarehouseDetailsResponse,
} from '@features/warehouse';

interface WarehouseState {
  warehouseDetails: WarehouseDetailsResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: WarehouseState = {
  warehouseDetails: null,
  loading: false,
  error: null,
};

const warehouseSlice = createSlice({
  name: 'warehouseDetails',
  initialState,
  reducers: {
    clearWarehouseDetails(state) {
      state.warehouseDetails = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarehouseDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchWarehouseDetailsThunk.fulfilled,
        (state, action: PayloadAction<WarehouseDetailsResponse>) => {
          state.warehouseDetails = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchWarehouseDetailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearWarehouseDetails } = warehouseSlice.actions;
export default warehouseSlice.reducer;
