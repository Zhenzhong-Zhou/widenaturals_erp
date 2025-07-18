import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AddressByCustomerLookup,
  AddressByCustomerLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchCustomerAddressesLookupThunk } from '@features/lookup/state/lookupThunks';

/**
 * Initial state for addressByCustomerSlice.
 */
const initialState: AddressByCustomerLookupState = {
  data: [],
  loading: false,
  error: null,
};

/**
 * Redux slice for managing addresses fetched by customer ID.
 * Supports async lifecycle with pending/fulfilled/rejected states.
 */
const addressByCustomerLookupSlice = createSlice({
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
      .addCase(fetchCustomerAddressesLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomerAddressesLookupThunk.fulfilled,
        (state, action: PayloadAction<{ data: AddressByCustomerLookup[] }>) => {
          state.loading = false;
          state.data = action.payload.data;
        }
      )
      .addCase(fetchCustomerAddressesLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as { message?: string })?.message ??
          action.error.message ??
          'Failed to fetch addresses';
      });
  },
});

export const { resetCustomerAddresses } = addressByCustomerLookupSlice.actions;
export default addressByCustomerLookupSlice.reducer;
