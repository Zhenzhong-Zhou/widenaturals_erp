import { createSlice } from '@reduxjs/toolkit';
import { LotAdjustmentType } from './warehouseInventoryTypes.ts';
import { fetchAllDropdownLotAdjustmentTypesThunk } from './lotAdjustmentThunks.ts';

// Initial State
interface LotAdjustmentState {
  types: LotAdjustmentType[];
  loading: boolean;
  error: string | null;
}

const initialState: LotAdjustmentState = {
  types: [],
  loading: false,
  error: null,
};

// Slice Definition
const lotAdjustmentDropdownSlice = createSlice({
  name: 'lotAdjustment',
  initialState,
  reducers: {}, // No direct mutations needed
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllDropdownLotAdjustmentTypesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllDropdownLotAdjustmentTypesThunk.fulfilled,
        (state, action) => {
          state.loading = false;
          state.types = action.payload;
        }
      )
      .addCase(
        fetchAllDropdownLotAdjustmentTypesThunk.rejected,
        (state, action) => {
          state.loading = false;
          state.error = action.payload as string;
        }
      );
  },
});

export default lotAdjustmentDropdownSlice.reducer;
