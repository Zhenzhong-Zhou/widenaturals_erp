import { createSlice } from '@reduxjs/toolkit';
import type { CustomerLookupState } from './lookupTypes';
import { fetchCustomerLookupThunk } from './lookupThunks';

const initialState: CustomerLookupState = {
  data: [],
  loading: false,
  error: null,
  hasMore: false,
  limit: 10,
  offset: 0,
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
        const { items, hasMore, limit, offset } = action.payload;
        
        state.data = offset === 0 ? items : [...state.data, ...items];
        state.hasMore = hasMore;
        state.limit = limit;
        state.offset = offset;
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
