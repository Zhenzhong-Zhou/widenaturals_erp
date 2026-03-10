import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import {
  OrderTypeLookupItem,
  OrderTypeLookupResponse,
  OrderTypeLookupState,
} from './lookupTypes';
import { fetchOrderTypeLookupThunk } from './lookupThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';
import { applyPaginatedFulfilled } from '@features/lookup/utils/lookupReducers';
import { createInitialOffsetPaginatedState } from '@store/pagination';

const initialState: OrderTypeLookupState =
  createInitialOffsetPaginatedState<OrderTypeLookupItem>();

const orderTypeLookupSlice = createSlice({
  name: 'orderTypeLookup',
  initialState,
  reducers: {
    resetOrderTypeLookup(state) {
      state.data = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderTypeLookupThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchOrderTypeLookupThunk.fulfilled,
        (state, action: PayloadAction<OrderTypeLookupResponse>) => {
          applyPaginatedFulfilled(state, action.payload);
        }
      )
      .addCase(fetchOrderTypeLookupThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to fetch order types');
      });
  },
});

export const { resetOrderTypeLookup } = orderTypeLookupSlice.actions;
export default orderTypeLookupSlice.reducer;
