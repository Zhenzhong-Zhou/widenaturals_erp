import { createSlice } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type DiscountLookupItem,
  type DiscountLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchDiscountLookupThunk } from './lookupThunks';

const initialState: DiscountLookupState = createInitialPaginatedLookupState<DiscountLookupItem>();

const discountLookupSlice = createSlice({
  name: 'discountLookup',
  initialState,
  reducers: {
    /**
     * Clears the current discount lookup state.
     */
    clearDiscountLookup: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDiscountLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscountLookupThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.items;
      })
      .addCase(fetchDiscountLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as Error | { message?: string })?.message ||
          'Failed to fetch discount lookup';
      });
  },
});

export const { clearDiscountLookup } = discountLookupSlice.actions;
export default discountLookupSlice.reducer;
