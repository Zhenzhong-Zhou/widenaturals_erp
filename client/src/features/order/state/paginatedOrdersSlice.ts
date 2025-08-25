import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  OrderQueryParams,
  OrderListResponse,
  PaginatedOrderStateWithFilters,
} from '@features/order/state/orderTypes';
import { fetchOrdersByCategoryThunk } from '@features/order/state/orderThunks';

const initialState: PaginatedOrderStateWithFilters = {
  data: [],
  pagination: {
    page: 1,
    limit: 10,
    totalRecords: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
  filters: {},
};

const paginatedOrdersSlice = createSlice({
  name: 'paginatedOrders',
  initialState,
  reducers: {
    resetOrderListState: () => initialState,
    
    /**
     * Updates the current filter parameters used for order list retrieval.
     */
    setOrderListFilters: (state, action: PayloadAction<OrderQueryParams>) => {
      state.filters = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdersByCategoryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersByCategoryThunk.fulfilled, (state, action: PayloadAction<OrderListResponse>) => {
        state.loading = false;
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOrdersByCategoryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to load orders.';
      });
  },
});

export const { resetOrderListState, setOrderListFilters } = paginatedOrdersSlice.actions;
export default paginatedOrdersSlice.reducer;
