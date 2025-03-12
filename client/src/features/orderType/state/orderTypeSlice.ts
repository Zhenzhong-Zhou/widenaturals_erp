import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OrderType, OrderTypePagination, OrderTypeResponse } from './orderTypeTypes.ts';
import { fetchAllOrderTypesThunk } from './orderTypeThunks.ts';

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
  name: "orderTypes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllOrderTypesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllOrderTypesThunk.fulfilled, (state, action: PayloadAction<OrderTypeResponse>) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchAllOrderTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default orderTypesSlice.reducer;
