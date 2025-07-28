import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type SkuLookupItem,
  type SkuLookupResponse,
  type SkuLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchSkuLookupThunk } from './lookupThunks';

const initialState: SkuLookupState = createInitialPaginatedLookupState<SkuLookupItem>();

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
      .addCase(fetchSkuLookupThunk.fulfilled, (state, action: PayloadAction<SkuLookupResponse>) => {
        const { items, offset, limit, hasMore } = action.payload;
        state.data = offset === 0 ? items : [...state.data, ...items];
        state.offset = offset;
        state.limit = limit;
        state.hasMore = hasMore;
        state.loading = false;
      })
      .addCase(fetchSkuLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? 'Failed to fetch SKU lookup';
      });
  },
});

export const { resetSkuLookup } = skuLookupSlice.actions;
export default skuLookupSlice.reducer;
