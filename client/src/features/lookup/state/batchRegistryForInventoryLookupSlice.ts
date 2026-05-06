import { createSlice } from '@reduxjs/toolkit';
import {
  type BatchRegistryLookupItem,
  fetchBatchRegistryForInventoryLookupThunk
} from '@features/lookup/state';
import type { BatchRegistryLookupState } from '@features/lookup/state';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';
import { createInitialOffsetPaginatedState } from '@store/pagination';

const MAX_ITEMS = 20;

const initialState: BatchRegistryLookupState =
  createInitialOffsetPaginatedState<BatchRegistryLookupItem>();

const batchRegistryForInventoryLookupSlice = createSlice({
  name: 'batchRegistryForInventoryLookup',
  initialState,
  reducers: {
    resetBatchRegistryForInventoryLookup: () =>
      createInitialOffsetPaginatedState<BatchRegistryLookupItem>(),
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBatchRegistryForInventoryLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchBatchRegistryForInventoryLookupThunk.fulfilled,
        (state, action) => {
          const { items, limit, offset, hasMore } = action.payload;
          state.loading = false;
          
          state.data =
            offset === 0
              ? items
              : [...state.data, ...items].slice(-MAX_ITEMS);
          
          state.limit = limit;
          state.offset = offset;
          state.hasMore = hasMore;
        }
      )
      .addCase(
        fetchBatchRegistryForInventoryLookupThunk.rejected,
        (state, action) => {
          applyRejected(
            state,
            action,
            'Failed to fetch inventory lookup items'
          );
        }
      );
  },
});

export const { resetBatchRegistryForInventoryLookup } =
  batchRegistryForInventoryLookupSlice.actions;
export default batchRegistryForInventoryLookupSlice.reducer;
