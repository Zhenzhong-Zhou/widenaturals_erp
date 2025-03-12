import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { OrderType, OrderTypeResponse } from './orderTypeTypes.ts';
import { fetchAllOrderTypesThunk } from './orderTypeThunks.ts';

interface OrderTypesState {
  data: OrderType[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderTypesState = {
  data: [],
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
      })
      .addCase(fetchAllOrderTypesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Something went wrong";
      });
  },
});

export default orderTypesSlice.reducer;
