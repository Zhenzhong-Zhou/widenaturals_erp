import { createSlice } from '@reduxjs/toolkit';
import { createSalesOrderThunk } from '@features/order';

interface SalesOrderState {
  salesOrderId: string | null;
  loading: boolean;
  success: boolean;
  error: string | null;
}

const initialState: SalesOrderState = {
  salesOrderId: null,
  loading: false,
  success: false,
  error: null
};

const createSalesOrderSlice = createSlice({
  name: 'createSalesOrder',
  initialState,
  reducers: {}, // No manual reducers needed since async thunk handles state updates
  extraReducers: (builder) => {
    builder
      .addCase(createSalesOrderThunk.pending, (state) => {
        state.loading = true;
        state.success = false;
        state.error = null;
      })
      .addCase(createSalesOrderThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.success = true;
        state.salesOrderId = action.payload.salesOrderId;
      })
      .addCase(createSalesOrderThunk.rejected, (state, action) => {
        state.loading = false;
        state.success = false;
        state.error = action.payload || 'Failed to create sales order';
      });
  }
});

export default createSalesOrderSlice.reducer;
