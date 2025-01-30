import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { fetchPricingTypeDetailsThunk } from './pricingTypeThunks';
import { PricingTypeDetail, PricingRecord, PricingTypePagination, PricingTypeResponse } from './pricingTypeTypes';

interface PricingTypeState {
  pricingTypeDetails: PricingTypeDetail | null; // Now a single object instead of an array
  pricingDetails: PricingRecord[]; // List of pricing records
  pagination: PricingTypePagination | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PricingTypeState = {
  pricingTypeDetails: null, // Single object instead of array
  pricingDetails: [],
  pagination: null,
  isLoading: false,
  error: null,
};

const pricingTypeSlice = createSlice({
  name: 'pricingTypeDetails',
  initialState,
  reducers: {
    resetPricingTypeState: (state) => {
      state.pricingTypeDetails = null;
      state.pricingDetails = [];
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
        state.pricingTypeDetails = action.payload.data.pricingTypeDetails; // Correctly accessing single object
        state.pricingDetails = action.payload.data.pricingDetails; // Correctly accessing the pricing details array
        state.pagination = action.payload.data.pagination; // Correctly accessing pagination data
      })
      .addCase(fetchPricingTypeDetailsThunk.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch pricing type details.';
      });
  },
});

export const { resetPricingTypeState } = pricingTypeSlice.actions;

export default pricingTypeSlice.reducer;
