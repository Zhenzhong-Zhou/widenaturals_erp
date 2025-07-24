import { createSlice } from '@reduxjs/toolkit';
import {
  createInitialPaginatedLookupState,
  type CustomerLookupItem,
  type CustomerLookupState
} from './lookupTypes';
import { fetchCustomerLookupThunk } from './lookupThunks';

const initialState: CustomerLookupState = createInitialPaginatedLookupState<CustomerLookupItem>();

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
        const { items, hasMore, limit, offset } = action.payload;

        state.data = offset === 0 ? items : [...state.data, ...items];
        state.hasMore = hasMore ?? false;
        state.limit = limit ?? 50;
        state.offset = offset ?? 0;
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
