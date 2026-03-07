import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  CreateSalesOrderResponse,
  SalesOrderCreationState,
} from '@features/order/state/orderTypes';
import { createSalesOrderThunk } from './orderThunks';
import { applyRejected } from '@features/shared/async/asyncReducerUtils';

const initialState: SalesOrderCreationState = {
  loading: false,
  error: null,
  data: null,
};

export const salesOrderCreationSlice = createSlice({
  name: 'salesOrderCreation',
  initialState,
  reducers: {
    resetSalesOrderCreation: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(createSalesOrderThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.data = null;
      })
      .addCase(
        createSalesOrderThunk.fulfilled,
        (state, action: PayloadAction<CreateSalesOrderResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
        }
      )
      .addCase(createSalesOrderThunk.rejected, (state, action) => {
        applyRejected(state, action, 'Failed to create sales order.');
      });
  },
});

export const { resetSalesOrderCreation } = salesOrderCreationSlice.actions;
export default salesOrderCreationSlice.reducer;
