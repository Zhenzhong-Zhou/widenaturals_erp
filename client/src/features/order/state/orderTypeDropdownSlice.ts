import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { OrderType } from './orderTypes.ts';
import { fetchOrderTypesDropDownThunk } from './orderThunks.ts';

interface OrderTypeState {
  orderTypes: OrderType[];
  loading: boolean;
  error: string | null;
}

const initialState: OrderTypeState = {
  orderTypes: [],
  loading: false,
  error: null,
};

const orderTypeSlice = createSlice({
  name: 'orderTypesDropdown',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderTypesDropDownThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchOrderTypesDropDownThunk.fulfilled,
        (state, action: PayloadAction<OrderType[]>) => {
          state.loading = false;
          state.orderTypes = action.payload;
        }
      )
      .addCase(fetchOrderTypesDropDownThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to load order types.';
      });
  },
});

export default orderTypeSlice.reducer;
