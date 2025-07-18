import { createSlice } from '@reduxjs/toolkit';
import type { CustomerCreateState } from './customerTypes';
import { createCustomersThunk } from './customerThunks';
import type { CreateCustomerResponse } from './customerTypes';

const initialState: CustomerCreateState = {
  data: null,
  loading: false,
  error: null,
};

const customerCreateSlice = createSlice({
  name: 'customerCreate',
  initialState,
  reducers: {
    resetCustomerCreateState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCustomersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(createCustomersThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;

        const result = action.payload as CreateCustomerResponse;

        // Always normalize data to an array form
        state.data = Array.isArray(result.data) ? result.data : [result.data];

        // Store success and message (optional fields in the interface)
        state.success = result.success;
        state.message = result.message;
      })
      .addCase(createCustomersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as Error)?.message || 'Failed to create customer(s)';
        state.data = null;
      });
  },
});

export const { resetCustomerCreateState } = customerCreateSlice.actions;
export default customerCreateSlice.reducer;
