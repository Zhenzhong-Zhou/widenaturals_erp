import { createSlice } from '@reduxjs/toolkit';
import type { PaginatedCustomerState } from './customerTypes';
import { fetchPaginatedCustomersThunk } from './customerThunks';

const initialState: PaginatedCustomerState = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const paginatedCustomersSlice = createSlice({
  name: 'paginatedCustomers',
  initialState,
  reducers: {
    resetPaginatedCustomersState: () => initialState,
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
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch customers';
      });
  },
});

export const { resetPaginatedCustomersState } = paginatedCustomersSlice.actions;
export default paginatedCustomersSlice.reducer;
