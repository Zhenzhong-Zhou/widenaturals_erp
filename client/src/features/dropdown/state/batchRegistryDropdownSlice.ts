import { createSlice } from '@reduxjs/toolkit';
import { fetchBatchRegistryDropdownThunk } from './dropdownThunks';
import type { BatchRegistryDropdownState } from '../state/dropdownTypes';

const initialState: BatchRegistryDropdownState = {
  loading: false,
  error: null,
  data: [],
  hasMore: false,
  limit: 50,
  offset: 0,
};

const batchRegistryDropdownSlice = createSlice({
  name: 'batchRegistryDropdown',
  initialState,
  reducers: {
    resetBatchRegistryDropdownState: (state) => {
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
      .addCase(fetchBatchRegistryDropdownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatchRegistryDropdownThunk.fulfilled, (state, action) => {
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
      .addCase(fetchBatchRegistryDropdownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch dropdown items';
      });
  },
});

export const { resetBatchRegistryDropdownState } = batchRegistryDropdownSlice.actions;
export default batchRegistryDropdownSlice.reducer;
