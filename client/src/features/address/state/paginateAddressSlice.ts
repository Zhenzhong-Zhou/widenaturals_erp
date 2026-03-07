import { createSlice } from '@reduxjs/toolkit';
import type { AddressListItem, PaginateAddressState } from './addressTypes';
import { fetchPaginatedAddressesThunk } from './addressThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';
import { createInitialPaginatedState } from '@store/pagination';

const initialState: PaginateAddressState =
  createInitialPaginatedState<AddressListItem>();

export const paginateAddressSlice = createSlice({
  name: 'paginateAddress',
  initialState,
  reducers: {
    /** You could add local reducers here, e.g. reset state if needed */
    resetPaginatedAddresses: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedAddressesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaginatedAddressesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPaginatedAddressesThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch addresses.');
      });
  },
});

// Export actions if you want to dispatch e.g. reset
export const { resetPaginatedAddresses } = paginateAddressSlice.actions;

// Export reducer for store
export default paginateAddressSlice.reducer;
