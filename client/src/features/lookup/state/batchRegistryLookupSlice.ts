import { createSlice } from '@reduxjs/toolkit';
import {
  type BatchRegistryLookupItem,
  fetchBatchRegistryLookupThunk,
} from '@features/lookup/state';
import type { BatchRegistryLookupState } from '@features/lookup/state';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';
import { createInitialOffsetPaginatedState } from '@store/pagination';

const initialState: BatchRegistryLookupState =
  createInitialOffsetPaginatedState<BatchRegistryLookupItem>();

const batchRegistryLookupSlice = createSlice({
  name: 'batchRegistryLookup',
  initialState,
  reducers: {
    resetBatchRegistryLookup: () =>
      createInitialOffsetPaginatedState<BatchRegistryLookupItem>(),
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
        applyRejected(state, action, 'Failed to fetch lookup items');
      });
  },
});

export const { resetBatchRegistryLookup } = batchRegistryLookupSlice.actions;
export default batchRegistryLookupSlice.reducer;
