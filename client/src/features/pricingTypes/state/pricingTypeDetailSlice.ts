import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchPricingTypeDetailsThunk } from './pricingTypeThunks';
import { PricingTypeDetails, PricingTypePagination, PricingTypeResponse } from './pricingTypeTypes.ts';

interface PricingTypeState {
  data: PricingTypeDetails[];
  pagination: PricingTypePagination | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PricingTypeState = {
  data: [],
  pagination: null,
  isLoading: false,
  error: null,
};

const pricingTypeSlice = createSlice({
  name: 'pricingTypeDetails',
  initialState,
  reducers: {
    resetPricingTypeState: (state) => {
      state.data = [];
      state.pagination = null;
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingTypeDetailsThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPricingTypeDetailsThunk.fulfilled, (state, action: PayloadAction<PricingTypeResponse>) => {
        state.isLoading = false;
        state.data = action.payload.data.data; // Access the nested `data` array
        state.pagination = action.payload.data.pagination; // Access the nested `pagination`
      })
      .addCase(fetchPricingTypeDetailsThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch pricing type details.';
      });
  },
});

export const { resetPricingTypeState } = pricingTypeSlice.actions;

export default pricingTypeSlice.reducer;
