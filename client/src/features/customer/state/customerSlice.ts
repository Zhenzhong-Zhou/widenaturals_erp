import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchCustomersThunk } from './customerThunks';
import type {
  Customer,
  CustomerListResponse,
  CustomerPagination,
} from './customerTypes';

interface CustomerState {
  customers: Customer[];
  pagination: CustomerPagination | null;
  loading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  pagination: null,
  loading: false,
  error: null,
};

const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomersThunk.fulfilled,
        (state, action: PayloadAction<CustomerListResponse>) => {
          state.loading = false;
          state.customers = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchCustomersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'An error occurred.';
      });
  },
});

export default customerSlice.reducer;
