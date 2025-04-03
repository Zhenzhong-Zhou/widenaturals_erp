import { createSlice } from '@reduxjs/toolkit';
import { OrderStatusUpdateResponse } from './orderTypes.ts';
import { confirmSalesOrderThunk } from './orderThunks.ts';

interface ConfirmSalesOrderState {
  data: OrderStatusUpdateResponse | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ConfirmSalesOrderState = {
  data: null,
  loading: false,
  error: null,
  successMessage: null,
};

const confirmSalesOrderSlice = createSlice({
  name: 'confirmSalesOrder',
  initialState,
  reducers: {
    resetConfirmSalesOrderState: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(confirmSalesOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(confirmSalesOrderThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.successMessage = action.payload.message;
      })
      .addCase(confirmSalesOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Unknown error occurred';
      });
  },
});

export const { resetConfirmSalesOrderState } = confirmSalesOrderSlice.actions;
export default confirmSalesOrderSlice.reducer;
