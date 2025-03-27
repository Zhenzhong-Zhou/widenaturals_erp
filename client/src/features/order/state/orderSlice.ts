import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order, OrdersResponse } from './orderTypes.ts';
import { fetchAllOrdersThunk } from './orderThunks.ts';

// Define the initial state type
interface OrdersState {
  orders: Order[];
  pagination: OrdersResponse['pagination'];
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: OrdersState = {
  orders: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

// Orders slice
const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllOrdersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrdersThunk.fulfilled, (state, action: PayloadAction<OrdersResponse>) => {
        state.loading = false;
        state.orders = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllOrdersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default orderSlice.reducer;
