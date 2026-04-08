import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  AddressByCustomerLookupResponse,
  AddressByCustomerLookupState,
} from '@features/lookup/state/lookupTypes';
import { fetchCustomerAddressesLookupThunk } from '@features/lookup/state/lookupThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

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
    resetAddressByCustomerLookup: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerAddressesLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchCustomerAddressesLookupThunk.fulfilled,
        (state, action: PayloadAction<AddressByCustomerLookupResponse>) => {
          state.loading = false;
          state.error = null;
          state.data = action.payload.items;
        }
      )
      .addCase(fetchCustomerAddressesLookupThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch addresses');
      });
  },
});

export const { resetAddressByCustomerLookup } =
  addressByCustomerLookupSlice.actions;
export default addressByCustomerLookupSlice.reducer;
