import { createAsyncThunk } from '@reduxjs/toolkit';
import type { FetchOrdersParams, OrdersResponse } from '@features/order';

type OrderFetchFn = (params: FetchOrdersParams) => Promise<OrdersResponse>;

export const createOrderThunk = (type: string, fetchFn: OrderFetchFn) =>
  createAsyncThunk(
    type,
    async (params: FetchOrdersParams, { rejectWithValue }) => {
      try {
        return await fetchFn(params);
      } catch (error: any) {
        return rejectWithValue(error.message);
      }
    }
  );
