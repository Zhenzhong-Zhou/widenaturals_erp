import { createSlice } from '@reduxjs/toolkit';
import { fetchBatchRegistryLookupThunk } from './lookupThunks';
import type { BatchRegistryLookupState } from '@features/lookup/state/lookupTypes';

const initialState: BatchRegistryLookupState = {
  loading: false,
  error: null,
  data: [],
  hasMore: false,
  limit: 50,
  offset: 0,
};

const batchRegistryLookupSlice = createSlice({
  name: 'batchRegistryLookup',
  initialState,
  reducers: {
    resetBatchRegistryLookupState: (state) => {
      state.loading = false;
      state.error = null;
      state.data = [];
      state.hasMore = false;
      state.limit = 50;
      state.offset = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBatchRegistryLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatchRegistryLookupThunk.fulfilled, (state, action) => {
        const { items, limit, offset, hasMore } = action.payload;
        state.loading = false;

        const MAX_ITEMS = 500;

        state.data =
          offset === 0
            ? items // first page: replace
            : [...state.data, ...items].slice(-MAX_ITEMS); // append and trim

        state.limit = limit;
        state.offset = offset;
        state.hasMore = hasMore;
      })
      .addCase(fetchBatchRegistryLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch lookup items';
      });
  },
});

export const { resetBatchRegistryLookupState } =
  batchRegistryLookupSlice.actions;
export default batchRegistryLookupSlice.reducer;
