import { createSlice } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type CustomerLookupItem,
  type CustomerLookupState,
} from './lookupTypes';
import { fetchCustomerLookupThunk } from './lookupThunks';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';

const initialState: CustomerLookupState =
  createInitialPaginatedLookupState<CustomerLookupItem>();

const customerLookupSlice = createSlice({
  name: 'customerLookup',
  initialState,
  reducers: {
    resetCustomerLookup: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerLookupThunk.fulfilled, (state, action) => {
        applyPaginatedFulfilled(state, action.payload);
      })
      .addCase(fetchCustomerLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetCustomerLookup } = customerLookupSlice.actions;
export default customerLookupSlice.reducer;
