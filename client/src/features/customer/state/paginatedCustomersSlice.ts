import { createSlice } from '@reduxjs/toolkit';
import type {
  CustomerListItem,
  PaginatedCustomerState,
} from '@features/customer/state';
import { fetchPaginatedCustomersThunk } from '@features/customer/state';
import { createInitialPaginatedState } from '@store/pagination';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: PaginatedCustomerState =
  createInitialPaginatedState<CustomerListItem>();

const paginatedCustomersSlice = createSlice({
  name: 'paginatedCustomers',
  initialState,
  reducers: {
    resetPaginatedCustomers: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaginatedCustomersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaginatedCustomersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchPaginatedCustomersThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch customers.');
      });
  },
});

export const { resetPaginatedCustomers } = paginatedCustomersSlice.actions;
export default paginatedCustomersSlice.reducer;
