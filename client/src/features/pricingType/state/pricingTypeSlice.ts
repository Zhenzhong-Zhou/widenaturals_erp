import { createSlice } from '@reduxjs/toolkit';
import type { PricingTypesState } from './pricingTypeTypes';
import { fetchAllPricingTypesThunk } from './pricingTypeThunks';

const initialState: PricingTypesState = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  },
  isLoading: false,
  error: null,
};

const pricingTypeSlice = createSlice({
  name: 'pricingTypes',
  initialState,
  reducers: {
    clearPricingTypesState: (state) => {
      state.data = [];
      state.pagination = { page: 1, limit: 10, totalRecords: 0, totalPages: 0 };
      state.isLoading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPricingTypesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAllPricingTypesThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllPricingTypesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || 'Failed to fetch pricing types';
      });
  },
});

export const { clearPricingTypesState } = pricingTypeSlice.actions;
export default pricingTypeSlice.reducer;
