import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { type OrderTypePagination } from '@features/orderType/state/orderTypeTypes';
import {
  fetchAllOrderTypesThunk,
  type OrderType,
  type OrderTypeResponse,
} from '@features/orderType';

interface OrderTypesState {
  data: OrderType[];
  pagination: OrderTypePagination;
  loading: boolean;
  error: string | null;
}

const initialState: OrderTypesState = {
  data: [],
  pagination: { page: 1, limit: 10, totalRecords: 0, totalPages: 1 },
  loading: false,
  error: null,
};

const orderTypesSlice = createSlice({
  name: 'orderTypes',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllOrderTypesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAllOrderTypesThunk.fulfilled,
        (state, action: PayloadAction<OrderTypeResponse>) => {
          state.loading = false;
          state.data = action.payload.data;
          state.pagination = action.payload.pagination;
        }
      )
      .addCase(fetchAllOrderTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Something went wrong';
      });
  },
});

export default orderTypesSlice.reducer;
