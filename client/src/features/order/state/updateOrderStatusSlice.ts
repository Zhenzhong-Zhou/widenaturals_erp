import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  UpdateOrderStatusResponse,
  UpdateOrderStatusState,
} from './orderTypes';
import { updateOrderStatusThunk } from '@features/order/state/orderThunks';

const initialState: UpdateOrderStatusState = {
  data: null,
  loading: false,
  error: null,
};

const updateOrderStatusSlice = createSlice({
  name: 'updateOrderStatus',
  initialState,
  reducers: {
    /**
     * Resets the status update state back to initial.
     */
    resetUpdateOrderStatus: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(updateOrderStatusThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(
        updateOrderStatusThunk.fulfilled,
        (state, action: PayloadAction<UpdateOrderStatusResponse>) => {
          state.loading = false;
          state.data = action.payload;
        }
      )
      .addCase(updateOrderStatusThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to update order status';
      });
  },
});

export const { resetUpdateOrderStatus } = updateOrderStatusSlice.actions;
export default updateOrderStatusSlice.reducer;
