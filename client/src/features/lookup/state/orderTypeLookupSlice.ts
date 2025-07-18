import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { OrderTypeLookupResponse, OrderTypeLookupState } from './lookupTypes';
import { fetchOrderTypeLookupThunk } from './lookupThunks';

const initialState: OrderTypeLookupState = {
  data: [],
  loading: false,
  error: null,
};

const orderTypeLookupSlice = createSlice({
  name: 'orderTypeLookup',
  initialState,
  reducers: {
    clearOrderTypeLookup(state) {
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
          state.loading = false;
          state.data = action.payload.data;
          state.error = null;
        }
      )
      .addCase(fetchOrderTypeLookupThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearOrderTypeLookup } = orderTypeLookupSlice.actions;
export default orderTypeLookupSlice.reducer;
