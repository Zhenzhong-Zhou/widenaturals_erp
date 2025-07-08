import { createSlice } from '@reduxjs/toolkit';
import type { CustomerLookupState } from './lookupTypes';
import { fetchCustomerLookupThunk } from './lookupThunks';

const initialState: CustomerLookupState = {
  data: [],
  loading: false,
  error: null,
};

const customerLookupSlice = createSlice({
  name: 'customerLookup',
  initialState,
  reducers: {
    resetCustomerLookup: (state) => {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerLookupThunk.fulfilled, (state, action) => {
        state.data = action.payload.items;
        state.loading = false;
      })
      .addCase(fetchCustomerLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetCustomerLookup } = customerLookupSlice.actions;
export default customerLookupSlice.reducer;
