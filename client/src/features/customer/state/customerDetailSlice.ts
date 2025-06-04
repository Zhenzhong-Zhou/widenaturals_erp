import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchCustomerByIdThunk } from './customerThunks';
import type { CustomerDetails } from './customerTypes';

interface CustomerDetailState {
  customer: CustomerDetails | null;
  loading: boolean;
  error: string | null;
}

const initialState: CustomerDetailState = {
  customer: null,
  loading: false,
  error: null,
};

const customerDetailSlice = createSlice({
  name: 'customerDetail',
  initialState,
  reducers: {
    clearCustomerDetail: (state) => {
      state.customer = null;
      state.error = null;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomerByIdThunk.fulfilled,
        (state, action: PayloadAction<CustomerDetails>) => {
          state.loading = false;
          state.customer = action.payload;
        }
      )
      .addCase(fetchCustomerByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch customer details.';
      });
  },
});

export const { clearCustomerDetail } = customerDetailSlice.actions;
export default customerDetailSlice.reducer;
