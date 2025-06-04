import {
  createSlice,
  type PayloadAction,
  type AsyncThunk,
} from '@reduxjs/toolkit';
import type { Order, OrdersResponse } from '@features/order';

interface OrdersState {
  orders: Order[];
  pagination: OrdersResponse['pagination'];
  loading: boolean;
  error: string | null;
}

const createOrderSlice = (
  name: string,
  fetchThunk: AsyncThunk<OrdersResponse, any, any>
) => {
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

  return createSlice({
    name,
    initialState,
    reducers: {},
    extraReducers: (builder) => {
      builder
        .addCase(fetchThunk.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(
          fetchThunk.fulfilled,
          (state, action: PayloadAction<OrdersResponse>) => {
            state.loading = false;
            state.orders = action.payload.data;
            state.pagination = action.payload.pagination;
          }
        )
        .addCase(fetchThunk.rejected, (state, action) => {
          state.loading = false;

          // Use type guard to safely access payload
          if (action.payload && typeof action.payload === 'string') {
            state.error = action.payload;
          } else {
            state.error = 'Failed to fetch orders';
          }
        });
    },
  });
};

export default createOrderSlice;
