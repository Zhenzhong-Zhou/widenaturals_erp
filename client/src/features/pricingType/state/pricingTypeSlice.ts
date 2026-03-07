import { createSlice } from '@reduxjs/toolkit';
import type { PricingType, PricingTypesState } from './pricingTypeTypes';
import { fetchAllPricingTypesThunk } from './pricingTypeThunks';
import { createInitialPaginatedState } from '@store/pagination';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: PricingTypesState =
  createInitialPaginatedState<PricingType>();

const pricingTypeSlice = createSlice({
  name: 'pricingTypes',
  initialState,
  reducers: {
    clearPricingTypesState: () => createInitialPaginatedState<PricingType>(),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllPricingTypesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.traceId = null;
      })

      .addCase(fetchAllPricingTypesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })

      .addCase(fetchAllPricingTypesThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch pricing types.');
      });
  },
});

export const { clearPricingTypesState } = pricingTypeSlice.actions;
export default pricingTypeSlice.reducer;
