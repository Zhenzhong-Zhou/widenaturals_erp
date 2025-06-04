import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchPricingTypeDropdownThunk } from './pricingTypeThunks';
import type { PricingTypeDropdownItem } from './pricingTypeTypes';

// Define the initial state
interface PricingTypeDropdownState {
  pricingTypes: PricingTypeDropdownItem[];
  loading: boolean;
  error: string | null;
}

const initialState: PricingTypeDropdownState = {
  pricingTypes: [],
  loading: false,
  error: null,
};

// Create the slice
const pricingTypeDropdownSlice = createSlice({
  name: 'pricingTypeDropdown',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingTypeDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchPricingTypeDropdownThunk.fulfilled,
        (state, action: PayloadAction<PricingTypeDropdownItem[]>) => {
          state.pricingTypes = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchPricingTypeDropdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default pricingTypeDropdownSlice.reducer;
