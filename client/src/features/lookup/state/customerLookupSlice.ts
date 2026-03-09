import { createSlice } from '@reduxjs/toolkit';
import type {
  CustomerLookupItem,
  CustomerLookupState,
} from '@features/lookup/state';
import { createInitialOffsetPaginatedState } from '@store/pagination';
import { fetchCustomerLookupThunk } from '@features/lookup/state';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: CustomerLookupState =
  createInitialOffsetPaginatedState<CustomerLookupItem>();

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
        applyRejected(state, action, 'Failed to fetch customers.');
      });
  },
});

export const { resetCustomerLookup } = customerLookupSlice.actions;
export default customerLookupSlice.reducer;
