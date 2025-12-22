import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  SkuLookupItem,
  SkuLookupResponse,
  SkuLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import {
  fetchSkuLookupThunk,
} from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

const initialState: SkuLookupState =
  createInitialOffsetPaginatedState<SkuLookupItem>();

const skuLookupSlice = createSlice({
  name: 'skuLookup',
  initialState,
  reducers: {
    /**
     * Resets the SKU lookup state to its initial default values.
     */
    resetSkuLookup: (state) => {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSkuLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchSkuLookupThunk.fulfilled,
        (state, action: PayloadAction<SkuLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchSkuLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ?? 'Failed to fetch SKU lookup';
      });
  },
});

export const { resetSkuLookup } = skuLookupSlice.actions;
export default skuLookupSlice.reducer;
