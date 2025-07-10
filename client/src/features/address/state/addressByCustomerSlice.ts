import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AddressByCustomer, AddressByCustomerState } from './addressTypes';
import { fetchCustomerAddressesThunk } from './addressThunks';

/**
 * Initial state for addressByCustomerSlice.
 */
const initialState: AddressByCustomerState = {
  data: [],
  loading: false,
  error: null,
};

/**
 * Redux slice for managing addresses fetched by customer ID.
 * Supports async lifecycle with pending/fulfilled/rejected states.
 */
const addressByCustomerSlice = createSlice({
  name: 'addressByCustomer',
  initialState,
  reducers: {
    /**
     * Resets address state to its initial values.
     */
    resetCustomerAddresses: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerAddressesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomerAddressesThunk.fulfilled,
        (state, action: PayloadAction<{ data: AddressByCustomer[] }>) => {
          state.loading = false;
          state.data = action.payload.data;
        }
      )
      .addCase(fetchCustomerAddressesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          'Failed to fetch addresses';
      });
  },
});

export const { resetCustomerAddresses } = addressByCustomerSlice.actions;
export default addressByCustomerSlice.reducer;
