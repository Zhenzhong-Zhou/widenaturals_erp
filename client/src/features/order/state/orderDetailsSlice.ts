import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  GetOrderDetailsUiResponse,
  OrderDetailsState,
} from '@features/order/state/orderTypes';
import { fetchOrderDetailsByIdThunk } from '@features/order';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

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
      .addCase(fetchOrderDetailsByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchOrderDetailsByIdThunk.fulfilled,
        (state, action: PayloadAction<GetOrderDetailsUiResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.error = null;
        }
      )
      .addCase(fetchOrderDetailsByIdThunk.rejected, (state, action) => {
        applyRejected(
          state,
          action,
          'Failed to fetch sales order details.'
        );
      });
  },
});

export const { resetOrderDetails } = orderDetailsSlice.actions;
export default orderDetailsSlice.reducer;
