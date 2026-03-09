import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchDiscountLookupThunk } from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import type {
  DiscountLookupItem,
  DiscountLookupResponse,
  DiscountLookupState,
} from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: DiscountLookupState =
  createInitialOffsetPaginatedState<DiscountLookupItem>();

const discountLookupSlice = createSlice({
  name: 'discountLookup',
  initialState,
  reducers: {
    /**
     * Clears the current discount lookup state.
     */
    resetDiscountLookup: (state) => {
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
      .addCase(
        fetchDiscountLookupThunk.fulfilled,
        (state, action: PayloadAction<DiscountLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchDiscountLookupThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch discount lookup');
      });
  },
});

export const { resetDiscountLookup } = discountLookupSlice.actions;
export default discountLookupSlice.reducer;
