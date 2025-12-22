import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  GetOrderDetailsResponse,
  OrderDetailsState,
} from '@features/order/state/orderTypes';
import { getOrderDetailsByIdThunk } from './orderThunks';

const initialState: OrderDetailsState = {
  data: null,
  loading: false,
  error: null,
};

const orderDetailsSlice = createSlice({
  name: 'orderDetails',
  initialState,
  reducers: {
    resetOrderDetails: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(getOrderDetailsByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getOrderDetailsByIdThunk.fulfilled,
        (state, action: PayloadAction<GetOrderDetailsResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
        }
      )
      .addCase(getOrderDetailsByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to fetch order details';
      });
  },
});

export const { resetOrderDetails } = orderDetailsSlice.actions;
export default orderDetailsSlice.reducer;
