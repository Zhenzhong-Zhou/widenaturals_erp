import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrderDetailsResponse } from './orderTypes.ts';
import { fetchSalesOrderDetailsThunk } from './orderThunks.ts';

interface SalesOrderDetailsState {
  data: OrderDetailsResponse | null;
  loading: boolean;
  error: string | null;
}

const initialState: SalesOrderDetailsState = {
  data: null,
  loading: false,
  error: null,
};

const salesOrderDetailsSlice = createSlice({
  name: 'salesOrderDetail',
  initialState,
  reducers: {
    clearOrderDetails: (state) => {
      state.data = null;
      state.error = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesOrderDetailsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesOrderDetailsThunk.fulfilled, (state, action: PayloadAction<OrderDetailsResponse>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchSalesOrderDetailsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearOrderDetails } = salesOrderDetailsSlice.actions;

export default salesOrderDetailsSlice.reducer;
