import { createSlice } from '@reduxjs/toolkit';
import { fetchPricingTypesThunk } from './pricingTypeThunks.ts';
import { PricingType } from './pricingTypeTypes';

export interface PricingTypesState {
  data: PricingType[];
  totalRecords: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: PricingTypesState = {
  data: [],
  totalRecords: 0,
  totalPages: 0,
  isLoading: false,
  error: null,
};

const pricingTypeSlice = createSlice({
  name: 'pricingTypes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricingTypesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPricingTypesThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data;
        state.totalRecords = action.payload.pagination.totalRecords;
        state.totalPages = action.payload.pagination.totalPages;
      })
      .addCase(fetchPricingTypesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch pricing types';
      });
  },
});

export default pricingTypeSlice.reducer;
